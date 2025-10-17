from fastapi import FastAPI, HTTPException, Depends, Query, status, Cookie, Response
from pydantic import BaseModel
from typing import Annotated, Optional

from sqlalchemy import text
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi.responses import JSONResponse
from seed_data import seed_initial_data

# routes/invoices.py (or inside your main app file if you keep routes together)
from sqlalchemy import func, and_
# from database import get_db   # <-- removed (you define get_db below)

app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Allows me to call these APIs from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)


# --- helper: week start (Monday) ---
def monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())

# --- schema for the response rows (optional, but nice) ---
class UtilizationRow(BaseModel):
    week_start: str              # ISO date (Monday)
    user_id: int
    user_name: str
    project_id: int
    staffed_hours: float
    actual_hours: float
    utilization_pct: Optional[float]  # null when staffed is 0
    
# Pydantic model for user creation validation
class UsersBase(BaseModel):
    id: int | None = None  # Optional, for existing users
    email: str
    name: str
    role: str = "contributor"
    
class ProjectsBase(BaseModel):
    name: str
    client_name: str
    start_date: str
    end_date: str
    started: bool = False
    
class ProjectStaffingBase(BaseModel):
    staffing_id: int | None = None  # Optional, for existing entries
    project_id: int
    user_id: int 
    role_name: str
    hourly_rate: int
    forecast_hours_initial: int
    forecast_hours_remaining: int
    
class PhasesBase(BaseModel):
    phase_id: int | None = None  # Optional, for existing entries
    project_id: int
    phase_name: str
    start_date: str
    end_date: str
    
class TaskBase(BaseModel):
    phase_id: int
    title: str
    description: str
    start_date: str
    end_date: str
    due_date: str
    status: str
    budget: int
    actual_spend: int | None = 0  # Optional, default to 0
    
class LoginRequest(BaseModel):
    email: str
    password: str

class TaskAssignmentsBase(BaseModel):
    task_id: int
    user_id: int
    hourly_rate: int
    
class TimeEntryBase(BaseModel):
    task_id: int
    user_id: int
    work_date: str
    hours: float
    is_billable: bool

class InvoicesBase(BaseModel):
    id: int | None = None  # <-- make id optional so DB can assign
    project_id: int
    client_name: str
    period_start: str
    period_end: str
    total_amount: int
    
# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
db_dependency = Annotated[Session, Depends(get_db)]

@app.on_event("startup")
async def on_startup():
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

# Mock login.
@app.post("/login/", status_code=status.HTTP_200_OK)
async def login(payloadCreds: LoginRequest, db: db_dependency):
    user = db.query(models.Users).filter(models.Users.email == payloadCreds.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    creds = db.query(models.UserCreds).filter(models.UserCreds.user_id == user.id).first()
    if not creds or creds.password != payloadCreds.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"user_id": user.id, "role": user.role}

@app.get("/users/", status_code=status.HTTP_200_OK)
async def get_users(db: db_dependency, role: Optional[str] = Query(None)):
    if role:
        users = db.query(models.Users).filter(models.Users.role == role).all()
        return users
    users = db.query(models.Users).all()
    return users


@app.post("/users/", status_code=status.HTTP_201_CREATED)
async def create_user(user: UsersBase, db: db_dependency):
    db_user = models.Users(**user.model_dump())
    db.add(db_user)
    db.commit()
    
@app.get("/projects/", status_code=status.HTTP_200_OK)
async def get_projects(db: db_dependency):
    projects = db.query(models.Projects).all()
    return projects

@app.get("/projects/{project_id}/", status_code=status.HTTP_200_OK)
async def get_project_specific(project_id: int, db: db_dependency):
    project = db.query(models.Projects).filter(models.Projects.id == project_id).first()
    return project

@app.post("/projects/", status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectsBase, db: db_dependency):
    print("Creating project:", project)
    db_project = models.Projects(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.put("/projects/{project_id}/", status_code=status.HTTP_200_OK)
async def update_project(project_id: int, project: ProjectsBase, db: db_dependency):
    db_project = db.query(models.Projects).filter(models.Projects.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for key, value in project.model_dump().items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/projects/{project_id}/staffing/", status_code=status.HTTP_200_OK)
async def get_project_staffing(project_id: int, db: db_dependency):
    staffing = db.query(models.ProjectStaffing).filter(models.ProjectStaffing.project_id == project_id).all()
    return staffing

@app.put("/projects/{project_id}/staffing/", status_code=status.HTTP_200_OK)
async def update_project_staffing(
    project_id: int,
    staffing_data: List[ProjectStaffingBase],
    db: db_dependency
):
    # Get existing staffing entries for the project
    existing_staffing = db.query(models.ProjectStaffing).filter(models.ProjectStaffing.project_id == project_id).all()
    existing_ids = {entry.id for entry in existing_staffing}

    # Process each entry in staffing_data
    for entry in staffing_data:
        entry_dict = entry.model_dump()
        entry_id = entry_dict.pop("staffing_id", None)  # Remove id from dict if present
        entry_dict.pop("project_id", None)  # Remove project_id to avoid overwriting
                
        if entry_id is None:
            # Create new staffing entry
            db_entry = models.ProjectStaffing(project_id=project_id, **entry_dict)
            db.add(db_entry)
        elif entry_id in existing_ids:
            # Update existing staffing entry
            db_entry = db.query(models.ProjectStaffing).filter(models.ProjectStaffing.id == entry_id).first()
            for key, value in entry_dict.items():
                if key != "id":
                    setattr(db_entry, key, value)

    db.commit()
    return {"message": "Staffing updated successfully"}

@app.get("/projects/{project_id}/phases/", status_code=status.HTTP_200_OK)
async def get_project_phases(project_id: int, db: db_dependency):
    phases = db.query(models.ProjectPhases).filter(models.ProjectPhases.project_id == project_id).all()
    return phases

@app.post("/projects/{project_id}/phases/", status_code=status.HTTP_201_CREATED)
async def create_project_phase(
    project_id: int,
    phases: List[PhasesBase],
    db: db_dependency
):
    
    # Get existing phases for the project
    existing_phases = db.query(models.ProjectPhases).filter(models.ProjectPhases.project_id == project_id).all()
    existing_ids = {entry.id for entry in existing_phases}
    
    #Process entry for each phase in phases
    for phase in phases:
        phase_dict = phase.model_dump()
        phase_id = phase_dict.pop("phase_id", None)  # Remove id from dict if present
        phase_dict.pop("project_id", None)  # Remove project_id to avoid overwriting
                
        if phase_id is None:
            # Create new phase entry
            db_phase = models.ProjectPhases(project_id=project_id, **phase_dict)
            db.add(db_phase)
        elif phase_id in existing_ids:
            # Update existing phase entry
            db_phase = db.query(models.ProjectPhases).filter(models.ProjectPhases.id == phase_id).first()
            for key, value in phase_dict.items():
                if key != "id":
                    setattr(db_phase, key, value)
    
    db.commit()
    return {"message": "Phases updated successfully"}

@app.get("/tasks/", status_code=status.HTTP_200_OK)
async def get_phase_tasks(
    db: db_dependency,
    phase_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None)
):    #Can fetch tasks by phase_id or user_id
    if phase_id is not None:
        tasks = db.query(models.Tasks).filter(models.Tasks.phase_id == phase_id).all()
    elif user_id is not None:
        assignments = db.query(models.TaskAssignments).filter(models.TaskAssignments.user_id == user_id).all()
        task_ids = [assignment.task_id for assignment in assignments]
        tasks = db.query(models.Tasks).filter(models.Tasks.id.in_(task_ids)).all()
    return tasks

# Creates a new task within a specific phase
@app.post("/tasks/", status_code=status.HTTP_201_CREATED)
async def create_phase_task(task: TaskBase, db: db_dependency):
    db_task = models.Tasks(**task.model_dump())
    print("Task: ", db_task)
    db.add(db_task)
    db.commit()
    return {"message": "Task created successfully", "task_id": db_task.id}


@app.get("/projects/tasks/assignments", status_code=status.HTTP_200_OK)
async def get_task_assignments(
    db: db_dependency,
    task_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None)
):
   # assignments = db.query(models.TaskAssignments).filter(models.TaskAssignments.task_id == task_id).all()
    
    if task_id is not None:
        assignments = db.query(models.TaskAssignments).filter(models.TaskAssignments.task_id == task_id).all()
    elif user_id is not None:
        assignments = db.query(models.TaskAssignments).filter(models.TaskAssignments.user_id == user_id).all()
    return assignments

@app.put("/projects/tasks/{task_id}/assignments", status_code=status.HTTP_200_OK)
async def update_task_assignments(
    task_id: int,
    assignments: List[TaskAssignmentsBase],
    db: db_dependency
):
    # Load once
    existing = db.query(models.TaskAssignments)\
        .filter(models.TaskAssignments.task_id == task_id).all()

    by_id = {a.id: a for a in existing}
    by_user = {a.user_id: a for a in existing}  # <- for upsert by user

    seen_ids = set()

    for incoming in assignments:
        data = incoming.model_dump()
        assignment_id: Optional[int] = data.pop("assignment_id", None)
        data.pop("task_id", None)  # never allow task_id override

        if assignment_id and assignment_id in by_id:
            # Update by id
            row = by_id[assignment_id]
            seen_ids.add(row.id)
            for k, v in data.items():
                setattr(row, k, v)

        else:
            user_id = data.get("user_id")
            if user_id in by_user:
                # Upsert by (task_id, user_id) to avoid duplicates
                row = by_user[user_id]
                seen_ids.add(row.id)
                for k, v in data.items():
                    setattr(row, k, v)
            else:
                # Create new
                row = models.TaskAssignments(task_id=task_id, **data)
                db.add(row)
                db.flush()  # to get row.id
                seen_ids.add(row.id)
                by_id[row.id] = row
                by_user[row.user_id] = row

    db.commit()
    return {"message": "Task assignments updated successfully"}

#Get time entry from Time Entries table based on task_id and user_id.
@app.get("/tasks/timeentries/", status_code=status.HTTP_200_OK)
async def get_time_entries(
    db: db_dependency,
    task_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None)
):
    if task_id is not None and user_id is not None:
        entries = db.query(models.TimeEntries).filter(
            models.TimeEntries.task_id == task_id,
            models.TimeEntries.user_id == user_id
        ).all()
    elif task_id is not None:
        entries = db.query(models.TimeEntries).filter(models.TimeEntries.task_id == task_id).all()
    elif user_id is not None:
        entries = db.query(models.TimeEntries).filter(models.TimeEntries.user_id == user_id).all()
    else:
        entries = db.query(models.TimeEntries).all()
    
    return entries

# Add time entry to Time Entries table.
@app.post("/tasks/timeentries/", status_code=status.HTTP_200_OK)
async def log_time_entry(entry: TimeEntryBase, db: db_dependency):
    db_entry = models.TimeEntries(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    return {"message": "Time entry logged successfully"}

#
## 
###WARNING: The following two APIs may not be needed. Check after.
##
#

# Gets all contributors assigned to a specific task
@app.get("/projects/tasks/{task_id}/contributors/", status_code=status.HTTP_200_OK)
async def get_task_contributors(task_id: int, db: db_dependency):
    assignments = db.query(models.TaskAssignments).filter(models.TaskAssignments.task_id == task_id).all()
    return assignments

@app.put("/projects/tasks/{task_id}/contributors/", status_code=status.HTTP_200_OK)
async def update_task_contributors(
    task_id: int,
    assignmentList: List[TaskAssignmentsBase],
    db: db_dependency
):
    # Get existing assignments for the task
    existing_assignments = db.query(models.TaskAssignments).filter(models.TaskAssignments.task_id == task_id).all()
    existing_ids = {assignment.id for assignment in existing_assignments}

    for assign in assignmentList:
        assign_dict = assign.model_dump()
        assign_id = assign_dict.pop("taskassign_id", None)
        assign_dict.pop("task_id", None)  # Avoid overwriting task_id

        if assign_id is not None and assign_id in existing_ids:
            # Update existing assignment
            db_assignment = db.query(models.TaskAssignments).filter(models.TaskAssignments.id == assign_id).first()
            for key, value in assign_dict.items():
                setattr(db_assignment, key, value)
        else:
            # Create new assignment
            db_assignment = models.TaskAssignments(task_id=task_id, **assign_dict)
            db.add(db_assignment)

    db.commit()
    return {"message": "Task contributors updated successfully"}

# Update staffing data depending on project ID
@app.put("/dynamic-staffing-adjustment", status_code=status.HTTP_200_OK)
async def dynamic_staffing_adjustment(
    db: db_dependency, *,
    task_id: int,
    user_id: int,
    hours: float,
):
    applyDecrementForecastHoursSQL = text("""
        UPDATE project_staffing AS ps
        JOIN tasks AS t ON t.id = :task_id
        JOIN project_phases AS ph on ph.id = t.phase_id
        SET ps.forecast_hours = GREATEST(ps.forecast_hours - :hours, 0)
        WHERE ps.project_id = ph.project_id
        AND ps.user_id = :user_id
    """)
    
    db.execute(applyDecrementForecastHoursSQL, {"task_id": task_id, "hours": hours, "user_id": user_id})
    db.commit()
    return {"message": "Forecast hours updated successfully"}


# Get total hours logged by a user on a specific project
@app.patch("/tasks/{task_id}/users/{user_id}/total-hours/", status_code=status.HTTP_200_OK)
async def get_total_hours(
    task_id: int,
    user_id: int,
    db: db_dependency
):
    # Get project_id from the given task_id
    project_id_sql = text("""
        SELECT phases.project_id
        FROM tasks
        JOIN project_phases AS phases ON tasks.phase_id = phases.id
        WHERE tasks.id = :task_id
        LIMIT 1
    """)
    project_result = db.execute(project_id_sql, {"task_id": task_id}).fetchone()
    if not project_result:
        raise HTTPException(status_code=404, detail="Project not found for given task_id")
    project_id = project_result.project_id

    # Get total hours for this user on this project
    total_hours_sql = text("""
        SELECT SUM(tentries.hours) AS total_hours
        FROM time_entries AS tentries
        JOIN tasks ON tentries.task_id = tasks.id
        JOIN project_phases AS phases ON tasks.phase_id = phases.id
        WHERE tentries.user_id = :user_id AND phases.project_id = :project_id
    """)
    result = db.execute(total_hours_sql, {"user_id": user_id, "project_id": project_id}).fetchone()
    total_hours = result.total_hours if result.total_hours is not None else 0.0
    
    # Update forecast_hours_remaining in project_staffing
    update_sql = text("""
        UPDATE project_staffing
        SET forecast_hours_remaining = GREATEST(forecast_hours_initial - :total_hours, 0)
        WHERE user_id = :user_id AND project_id = :project_id
    """)
    db.execute(update_sql, {"total_hours": total_hours, "user_id": user_id, "project_id": project_id})
    db.commit()

    return {"total_hours": total_hours}


# Get/update actual spend on a task level
@app.patch("/tasks/{task_id}/actual-spend/", status_code=status.HTTP_200_OK,)
async def get_and_update_actual_spend(
    task_id: int,
    db: db_dependency,
):
    # Calculate the actual spend based on the time entries and hourly rates for this task across all users assigned to it.
    actual_spend_sql = text("""
        SELECT SUM(user_spend) AS actual_spend
        FROM (
            SELECT ta.user_id, ta.hourly_rate, COALESCE(SUM(te.hours), 0) AS total_hours,
                   ta.hourly_rate * COALESCE(SUM(te.hours), 0) AS user_spend
            FROM task_assignments AS ta
            LEFT JOIN time_entries AS te
                ON ta.task_id = te.task_id AND ta.user_id = te.user_id
            WHERE ta.task_id = :task_id
            GROUP BY ta.user_id, ta.hourly_rate
        ) AS spend_per_user
    """)
    
    result = db.execute(actual_spend_sql, {"task_id": task_id}).fetchone()
    actual_spend = result.actual_spend if result.actual_spend is not None else 0.0

    # Update the actual_spend field in the Tasks table
    db_task = db.query(models.Tasks).filter(models.Tasks.id == task_id).first()
    if db_task:
        db_task.actual_spend = actual_spend
        db.commit()
        db.refresh(db_task)

    return {"actual_spend": actual_spend}

@app.get("/projects/{project_id}/users/{user_id}/timeentries/", status_code=status.HTTP_200_OK)
async def get_time_entries_by_date_range(
    project_id: int,
    user_id: int,
    start_date: str,
    end_date: str,
    db: db_dependency
):
    # Get all phase IDs for the project
    phase_ids = db.query(models.ProjectPhases.id).filter(models.ProjectPhases.project_id == project_id).subquery()
    # Get all task IDs for those phases
    task_ids = db.query(models.Tasks.id).filter(models.Tasks.phase_id.in_(phase_ids)).subquery()
    # Get time entries for those tasks, user, and date range
    entries = db.query(models.TimeEntries).filter(
        models.TimeEntries.task_id.in_(task_ids),
        models.TimeEntries.user_id == user_id,
        models.TimeEntries.work_date >= start_date,
        models.TimeEntries.work_date <= end_date
    ).all()
    return entries


@app.get("/projects/{project_id}/users-and-staffing/", status_code=status.HTTP_200_OK)
async def get_project_users(project_id: int, db: db_dependency):
    # Join Users and ProjectStaffing for the given project_id
    results = (
        db.query(models.Users, models.ProjectStaffing)
        .join(models.ProjectStaffing, models.Users.id == models.ProjectStaffing.user_id)
        .filter(models.ProjectStaffing.project_id == project_id)
        .all()
    )
    # Format output as list of dicts with user and staffing info
    response = [
        {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
            },
            "staffing": {
                "id": staffing.id,
                "project_id": staffing.project_id,
                "user_id": staffing.user_id,
                "role_name": staffing.role_name,
                "hourly_rate": staffing.hourly_rate,
                "forecast_hours_initial": staffing.forecast_hours_initial,
                "forecast_hours_remaining": staffing.forecast_hours_remaining,
            }
        }
        for user, staffing in results
    ]
    return response


@app.get("/projects/{project_id}/utilization", response_model=List[UtilizationRow], status_code=status.HTTP_200_OK)
def get_project_utilization(
    project_id: int,
    start: str,   # ISO date (any day) marking the left edge of your grid
    end: str,     # ISO date (any day) marking the right edge of your grid
    db: db_dependency
):
    # 1) Resolve project span (for even spread)
    proj_row = db.query(models.Projects).filter(models.Projects.id == project_id).first()
    if not proj_row:
        raise HTTPException(404, "Project not found")

    try:
        proj_start = datetime.fromisoformat(str(proj_row.start_date)).date()
        proj_end   = datetime.fromisoformat(str(proj_row.end_date)).date()
        window_start = datetime.fromisoformat(start).date()
        window_end   = datetime.fromisoformat(end).date()
    except Exception:
        raise HTTPException(400, "Invalid 'start' or 'end' date. Use YYYY-MM-DD.")

    proj_w0 = monday_of(proj_start)
    proj_wN = monday_of(proj_end)
    num_weeks = ((proj_wN - proj_w0).days // 7) + 1
    if num_weeks <= 0:
        num_weeks = 1

    # 2) Who is staffed on this project? (and their planned total hours)
    #    Join Users for names to render in the grid.
    staffed_rows = (
        db.query(models.ProjectStaffing, models.Users)
          .join(models.Users, models.Users.id == models.ProjectStaffing.user_id)
          .filter(models.ProjectStaffing.project_id == project_id)
          .all()
    )
    # Map user -> (name, total planned hours, staffed_per_week)
    staffed_info: Dict[int, Dict[str, Any]] = {}
    for ps, user in staffed_rows:
        total_plan = float(ps.forecast_hours_initial or 0)
        staffed_per_week = total_plan / num_weeks if num_weeks > 0 else 0.0
        staffed_info[ps.user_id] = {
            "name": user.name,
            "staffed_per_week": staffed_per_week,
        }

    # If no staffing exists yet, return empty (or include actual-only users if you prefer)
    if not staffed_info:
        return []

    # 3) Generate Monday weeks for the requested window
    win_w0 = monday_of(window_start)
    win_wN = monday_of(window_end)
    weeks: List[date] = []
    cur = win_w0
    while cur <= win_wN:
        weeks.append(cur)
        cur += timedelta(days=7)

    # 4) Get actual hours grouped by (user_id, week_start) inside the window
    actuals_sql = text("""
        SELECT
          te.user_id                                       AS user_id,
          DATE_SUB(te.work_date, INTERVAL WEEKDAY(te.work_date) DAY) AS week_start,
          SUM(te.hours)                                    AS actual_hours
        FROM time_entries te
        JOIN tasks t  ON t.id = te.task_id
        JOIN project_phases ph ON ph.id = t.phase_id
        WHERE ph.project_id = :project_id
          AND te.work_date BETWEEN :win_start AND :win_end
        GROUP BY te.user_id, week_start
    """)
    actual_rows = db.execute(
        actuals_sql,
        {
            "project_id": project_id,
            "win_start": win_w0.isoformat(),
            "win_end": (win_wN + timedelta(days=6)).isoformat(),  # include whole last week
        },
    ).fetchall()

    # Dict[(user_id, week_iso)] -> actual hours
    actual_map: Dict[tuple, float] = {}
    for r in actual_rows:
        wk_iso = r.week_start.strftime("%Y-%m-%d") if isinstance(r.week_start, date) else str(r.week_start)
        actual_map[(int(r.user_id), wk_iso)] = float(r.actual_hours or 0)

    # 5) Build rows: for each staffed user and each week in window,
    #    planned (even spread within project span) vs actual
    result: List[UtilizationRow] = []
    for user_id, info in staffed_info.items():
        for wk in weeks:
            wk_iso = wk.isoformat()
            # Only staff weeks that are inside the *project* span
            if proj_w0 <= wk <= proj_wN:
                staffed = float(info["staffed_per_week"])
            else:
                staffed = 0.0

            actual = float(actual_map.get((user_id, wk_iso), 0.0))
            util = (actual / staffed) if staffed > 0 else None

            result.append(UtilizationRow(
                week_start=wk_iso,
                user_id=user_id,
                user_name=info["name"],
                project_id=project_id,
                staffed_hours=round(staffed, 2),
                actual_hours=round(actual, 2),
                utilization_pct=(round(util, 4) if util is not None else None),
            ))

    # Sort by user_name then week
    result.sort(key=lambda r: (r.user_name.lower(), r.week_start))
    return result

# Get project's total spending across all tasks
@app.get("/projects/{project_id}/total-spend/", status_code=status.HTTP_200_OK)
def get_total_project_spend(project_id: int, db: Session = Depends(get_db)):
    per_row_sql = text("""
        SELECT
          te.id AS time_entry_id,
          te.task_id,
          te.user_id,
          te.work_date,
          COALESCE(te.hours, 0) AS hours,
          COALESCE(ta.hourly_rate, 0) AS hourly_rate,
          (COALESCE(te.hours, 0) * COALESCE(ta.hourly_rate, 0)) AS line_cost
        FROM time_entries AS te
        JOIN tasks AS t ON te.task_id = t.id
        JOIN task_assignments AS ta ON ta.task_id = t.id AND ta.user_id = te.user_id
        JOIN project_phases AS ph ON t.phase_id = ph.id
        WHERE ph.project_id = :project_id
        ORDER BY te.work_date ASC
    """)
    per_rows = db.execute(per_row_sql, {"project_id": project_id}).fetchall()

    rows = []
    for r in per_rows:
        # Build a plain dict from the SQLAlchemy Row in a robust way:
        # prefer r._mapping, then r._asdict(), then fallback to dict(r) if available.
        if hasattr(r, "_mapping"):
            rd = dict(r._mapping)
        elif hasattr(r, "_asdict"):
            rd = dict(r._asdict())
        else:
            rd = dict(r)

        # normalize types and formats
        rd["hours"] = float(rd.get("hours") or 0.0)
        rd["hourly_rate"] = float(rd.get("hourly_rate") or 0.0)
        rd["line_cost"] = float(rd.get("line_cost") or 0.0)
        if isinstance(rd.get("work_date"), (datetime, date)):
            rd["work_date"] = rd["work_date"].isoformat()
        rows.append(rd)

    total_sql = text("""
        SELECT
          SUM(COALESCE(te.hours, 0) * COALESCE(ta.hourly_rate, 0)) AS total_project_spent
        FROM time_entries AS te
        JOIN tasks AS t ON te.task_id = t.id
        JOIN task_assignments AS ta ON ta.task_id = t.id AND ta.user_id = te.user_id
        JOIN project_phases AS ph ON t.phase_id = ph.id
        WHERE ph.project_id = :project_id
    """)
    total_row = db.execute(total_sql, {"project_id": project_id}).fetchone()
    total_project_spent = float(total_row.total_project_spent or 0.0) if total_row else 0.0

    return {"total_project_spent": round(total_project_spent, 2)}

#Get total forecast cost for a project
@app.get("/projects/{project_id}/forecast-cost/", status_code=status.HTTP_200_OK)
def get_total_forecast_cost(project_id: int, db: Session = Depends(get_db)):
    forecast_sql = text("""WITH calc AS (
            SELECT
                COALESCE(hourly_rate, 0) * COALESCE(forecast_hours_initial, 0) AS calc_result
            FROM project_staffing
            WHERE project_id = :project_id
        )
        SELECT SUM(calc_result) AS total_project_forecast
        FROM calc""")
    total_row = db.execute(forecast_sql, {"project_id": project_id}).fetchone()
    total_project_forecast = float(total_row.total_project_forecast or 0.0) if total_row else 0.0
    return {"total_project_forecast": round(total_project_forecast, 2)}

# -----------------------
# Invoicing (Section 8)
# -----------------------

# 1) Create invoice (kept, just renamed the function)
@app.post("/invoices/", status_code=status.HTTP_201_CREATED)
async def create_invoice(invoice: InvoicesBase, db: db_dependency):
    print("Creating invoice:", invoice)
    db_invoice = models.Invoices(**invoice.model_dump())
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

# 2) Preview invoice lines (Task, Phase, Hours, Rate, Amount) for a period
@app.get("/projects/{project_id}/invoices/preview", status_code=status.HTTP_200_OK)
def preview_invoice(
    project_id: int,
    period_start: str = Query(..., description="YYYY-MM-DD"),
    period_end: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Sums billable hours × rate per (task, phase) for the given period.
    Returns rows and a total.
    """
    # Validate basic date strings (you are storing dates as strings)
    try:
        _ = datetime.fromisoformat(period_start)
        _ = datetime.fromisoformat(period_end)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    sql = text("""
        SELECT
          t.id                  AS task_id,
          t.title               AS task_title,
          ph.phase_name         AS phase_name,
          SUM(CASE WHEN te.is_billable THEN COALESCE(te.hours,0) ELSE 0 END) AS hours,
          -- Pick the first (or any) rate on the task for the user/time; if different users have different rates,
          -- we compute per-user then sum amounts below.
          SUM(CASE WHEN te.is_billable THEN COALESCE(te.hours,0) * COALESCE(ta.hourly_rate,0) ELSE 0 END) AS amount
        FROM tasks t
        JOIN project_phases ph ON ph.id = t.phase_id
        LEFT JOIN time_entries te ON te.task_id = t.id
        LEFT JOIN task_assignments ta ON ta.task_id = t.id AND ta.user_id = te.user_id
        WHERE ph.project_id = :project_id
          AND te.work_date BETWEEN :start AND :end
        GROUP BY t.id, t.title, ph.phase_name
        ORDER BY ph.phase_name, t.title
    """)
    rows = db.execute(sql, {
        "project_id": project_id,
        "start": period_start,
        "end": period_end
    }).fetchall()

    items = []
    total = 0.0
    for r in rows:
        mapping = r._mapping if hasattr(r, "_mapping") else r
        hours = float(mapping["hours"] or 0.0)
        amount = float(mapping["amount"] or 0.0)
        total += amount
        items.append({
            "task_id": int(mapping["task_id"]),
            "task_title": mapping["task_title"],
            "phase_name": mapping["phase_name"],
            "hours": round(hours, 2),
            "rate_info": "per-user rates applied",  # informative note
            "amount": round(amount, 2),
        })

    return {
        "project_id": project_id,
        "period_start": period_start,
        "period_end": period_end,
        "items": items,
        "total": round(total, 2),
    }

# 3) Generate (compute and persist) an invoice for a period
@app.post("/projects/{project_id}/invoices/generate", status_code=status.HTTP_201_CREATED)
def generate_invoice(
    project_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """
    Body:
    {
      "period_start": "YYYY-MM-DD",
      "period_end":   "YYYY-MM-DD",
      "client_name":  "Optional override (defaults to project.client_name)"
    }
    Computes total billable amount for the period and inserts into `invoices`.
    """
    period_start = payload.get("period_start")
    period_end = payload.get("period_end")
    client_override = payload.get("client_name")

    if not period_start or not period_end:
        raise HTTPException(status_code=400, detail="period_start and period_end are required.")

    # Validate date strings
    try:
        _ = datetime.fromisoformat(period_start)
        _ = datetime.fromisoformat(period_end)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Fetch default client from project
    proj = db.query(models.Projects).filter(models.Projects.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Compute total: sum of billable hours * rate within period
    total_sql = text("""
        SELECT
          SUM(CASE WHEN te.is_billable THEN COALESCE(te.hours,0) * COALESCE(ta.hourly_rate,0) ELSE 0 END) AS total_amount
        FROM time_entries te
        JOIN tasks t  ON t.id = te.task_id
        JOIN project_phases ph ON ph.id = t.phase_id
        LEFT JOIN task_assignments ta ON ta.task_id = t.id AND ta.user_id = te.user_id
        WHERE ph.project_id = :project_id
          AND te.work_date BETWEEN :start AND :end
    """)
    total_row = db.execute(total_sql, {
        "project_id": project_id,
        "start": period_start,
        "end": period_end,
    }).fetchone()

    total_amount = float(total_row.total_amount or 0.0)

    inv = models.Invoices(
        project_id=project_id,
        client_name=client_override or proj.client_name or "",
        period_start=period_start,
        period_end=period_end,
        total_amount=int(total_amount),
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    return {
        "id": inv.id,
        "project_id": inv.project_id,
        "client_name": inv.client_name,
        "period_start": inv.period_start,
        "period_end": inv.period_end,
        "total_amount": inv.total_amount,
    }

@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    # Ensure project exists
    project = db.query(models.Projects).filter(models.Projects.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Collect phase IDs for this project
    phase_ids = [pid for (pid,) in db.query(models.ProjectPhases.id)
                 .filter(models.ProjectPhases.project_id == project_id)
                 .all()]

    # Collect task IDs for those phases
    task_ids = []
    if phase_ids:
        task_ids = [tid for (tid,) in db.query(models.Tasks.id)
                    .filter(models.Tasks.phase_id.in_(phase_ids))
                    .all()]

    # 1) Delete time entries tied to tasks
    if task_ids:
        db.query(models.TimeEntries).filter(models.TimeEntries.task_id.in_(task_ids)) \
          .delete(synchronize_session=False)

    # 2) Delete task assignments tied to tasks
    if task_ids:
        db.query(models.TaskAssignments).filter(models.TaskAssignments.task_id.in_(task_ids)) \
          .delete(synchronize_session=False)

    # 3) Delete tasks
    if task_ids:
        db.query(models.Tasks).filter(models.Tasks.id.in_(task_ids)) \
          .delete(synchronize_session=False)

    # 4) Delete phases in this project
    if phase_ids:
        db.query(models.ProjectPhases).filter(models.ProjectPhases.id.in_(phase_ids)) \
          .delete(synchronize_session=False)

    # 5) Delete staffing entries for this project
    db.query(models.ProjectStaffing).filter(models.ProjectStaffing.project_id == project_id) \
      .delete(synchronize_session=False)

    # 6) Delete invoices for this project
    db.query(models.Invoices).filter(models.Invoices.project_id == project_id) \
      .delete(synchronize_session=False)

    # 7) Finally, delete the project
    db.query(models.Projects).filter(models.Projects.id == project_id) \
      .delete(synchronize_session=False)

    db.commit()
    return  # 204 No Content

@app.get("/projects/{project_id}/invoice-table/", status_code=status.HTTP_200_OK)
def get_invoice_table(
    project_id: int,
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    # validate date strings
    try:
        _ = datetime.fromisoformat(start_date)
        _ = datetime.fromisoformat(end_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # 1) Aggregate hours per (task_id, user_id) inside the period.
    #    This produces the raw numbers we will enrich with task/phase/user/rate info.
    hours_agg_sql = """
        SELECT
            te.task_id   AS task_id,
            te.user_id   AS user_id,
            SUM(te.hours) AS hours
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        JOIN project_phases ph ON t.phase_id = ph.id
        WHERE ph.project_id = :project_id
          AND te.work_date BETWEEN :start AND :end
        GROUP BY te.task_id, te.user_id
    """

    # 2) Build the final query by joining the aggregated hours to task, phase, user and
    #    left-joining to task_assignments to obtain the hourly rate (if present)
    sql = text(f"""
        SELECT
            agg.task_id          AS task_id,
            t.title              AS task_title,
            ph.phase_name        AS phase_name,
            u.id                 AS user_id,
            u.name               AS user_name,
            agg.hours            AS hours,
            COALESCE(ta.hourly_rate, 0) AS rate
        FROM (
            {hours_agg_sql}
        ) AS agg
        JOIN tasks t ON t.id = agg.task_id
        JOIN project_phases ph ON ph.id = t.phase_id
        LEFT JOIN task_assignments ta ON ta.task_id = agg.task_id AND ta.user_id = agg.user_id
        JOIN users u ON u.id = agg.user_id
        ORDER BY ph.phase_name, t.title, u.name
    """)

    rows = db.execute(sql, {"project_id": project_id, "start": start_date, "end": end_date}).fetchall()

    items = []
    total_amount = 0.0
    for r in rows:
        mapping = r._mapping if hasattr(r, "_mapping") else r
        hours = float(mapping.get("hours") or 0.0)
        rate = float(mapping.get("rate") or 0.0)
        amount = round(hours * rate, 2)
        total_amount += amount

        items.append({
            "task": mapping.get("task_title") or "",
            "phase": mapping.get("phase_name") or "",
            "task_contributor": mapping.get("user_name") or "",
            "hours": round(hours, 2),
            "rate": round(rate, 2),
            "amount": amount,
        })

    return {"rows": items, "total_amount": round(total_amount, 2)}