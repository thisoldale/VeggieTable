from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import datetime
from zoneinfo import ZoneInfo
import models
from database import engine
from routers import plants, garden_plans, plantings, tasks, task_groups
from version import __version__

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

la_tz = ZoneInfo('America/Los_Angeles')
build_date = datetime.datetime.now(la_tz).strftime("%Y-%m-%d %H:%M:%S %Z")

@app.get("/version")
def read_version():
    return {"version": __version__, "build_date": build_date}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8444"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plants.router)
app.include_router(garden_plans.router)
app.include_router(plantings.router)
app.include_router(tasks.router)
app.include_router(task_groups.router)
