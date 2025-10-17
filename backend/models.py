from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Users(Base):
    __tablename__ = "users"
    
    # index=True means that the column will be indexed in the database, which can improve query performance.
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(100), index=True)
    role = Column(String(11), default="contributor") # values: 'contributor' or 'manager' only.
    
class UserCreds(Base):
    __tablename__ = "user_creds"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    password = Column(String(255), nullable=False)
    
class Projects(Base):
    __tablename__ = "projects"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name = Column(String(100), index=True)
    client_name = Column(String(100), index=True)
    start_date = Column(String(200), index=True)  # Storing dates as strings for simplicity
    end_date = Column(String(200), index=True)    # Storing dates as strings for simplicity
    started = Column(Boolean, default=False)
    
class ProjectStaffing(Base):
    __tablename__ = "project_staffing"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id = Column(Integer, index=True)  # Foreign key to Projects.id
    user_id = Column(Integer, index=True)     # Foreign key to Users.id
    role_name = Column(String(100), index=True)
    hourly_rate = Column(Integer)
    forecast_hours_initial = Column(Integer)
    forecast_hours_remaining = Column(Integer)
    
class ProjectPhases(Base):
    __tablename__ = "project_phases"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id = Column(Integer, index=True)  # Foreign key to Projects.id
    phase_name = Column(String(100))
    start_date = Column(String(200), index=True)  # Storing dates as strings for simplicity
    end_date = Column(String(200), index=True)    # Storing dates as strings for simplicity
    
class Tasks(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    phase_id = Column(Integer, index=True)    # Foreign key to ProjectPhases.id
    title = Column(String(255))
    description = Column(String(500))
    start_date = Column(String(200), index=True)  # Storing dates as strings for simplicity
    end_date = Column(String(200), index=True)    # Storing dates as strings for simplicity
    due_date = Column(String(200), index=True)  # Storing dates as strings for simplicity
    status = Column(String(50), default="not started")  # e.g., 'not started', 'in progress', 'completed'
    budget = Column(Integer, index=True)
    actual_spend = Column(Integer, default=0)  # New field to track actual spend
    
class TaskAssignments(Base):
    __tablename__ = "task_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, index=True)  # Foreign key to Tasks.id
    user_id = Column(Integer, index=True)  # Foreign key to Users.id
    hourly_rate = Column(Integer)
    
class TimeEntries(Base):
    __tablename__ = "time_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, index=True)  # Foreign key to Tasks.id
    user_id = Column(Integer, index=True)  # Foreign key to Users.id
    work_date = Column(String(200), index=True)  # Storing dates as strings for simplicity
    hours = Column(Integer)
    is_billable = Column(Boolean, default=True)
    
class Invoices(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, index=True)  # Foreign key to Projects.id
    client_name = Column(String(100), index=True)
    period_start = Column(String(200), index=True)  # Storing dates as strings for simplicity
    period_end = Column(String(200), index=True)    # Storing dates as strings for simplicity
    total_amount = Column(Integer)