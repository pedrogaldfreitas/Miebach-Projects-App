### Running the App
Requirements: MySQL Server, Node.js, Python (3.13 or 3.14 should do, if online installation doesn't work, try Windows store version)

- Install MySQL Workbench
- Pull repository into local machine with ```git clone https://github.com/pedrogaldfreitas/Miebach-Projects-App.git```
- Get DB Backup (store this in a file called db or something in the repo)
- Run Database (Should be Services.msc -> MySQL80)
- Restore database
- pip install in the backend folder
- In Miebach-Projects-App/backend, run ```.venv\Scripts\python -m pip install -r requirements.txt``` to install backend dependencies.
- In Miebach-Projects-App/backend, run ```pip install``` followed by ```python -m uvicorn main:app --reload``` to run the backend.
- In Miebach-Projects-App/frontend, run ```npm run demo``` to run the frontend. *(If this doesn't work, run ```npm install``` followed by ```npm run dev``` in the frontend folder)*.

### Assumptions

- When seeing each contributor's Resource Utilization for a project, we display the staffed hours for **each week**, but we only have the contributors' **total Forecasted Hours** attribute. Therefore, for each 'Staffed' value in the utilization period, I assumed uniform staffing hours distribution for every week of the project and simply divided each contributor's total forecasted hours by 7 (days in a week).
- When invoicing, the case study instructions asks us to provide a table with the attributes **Task, Phase, Hours, Rate, Amount**. However, we know that the rate also depends on which contributor works on the task, as they have their own rate. Therefore, I added an extra column on the invoicing table for **Contributor**.
