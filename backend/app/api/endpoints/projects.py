"""
Projects CRUD — create, read, update, archive.
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, require_client_or_admin
from app.models.estate import Project, User
from app.services.audit_service import log_action, project_to_dict

router = APIRouter()


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    city: Optional[str] = None
    budget_total: Optional[float] = None
    timeline_json: Optional[dict] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    status: Optional[str] = None
    budget_total: Optional[float] = None
    timeline_json: Optional[dict] = None


def _project_out(p: Project) -> dict:
    return {
        "id": p.id,
        "owner_id": p.owner_id,
        "title": p.title,
        "description": p.description,
        "city": p.city,
        "status": p.status,
        "budget_total": p.budget_total,
        "timeline_json": p.timeline_json,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        "owner_name": p.owner.full_name if p.owner else None,
        "estimates_count": len(p.estimates) if p.estimates else 0,
        "files_count": len(p.files) if p.files else 0,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    project = Project(
        owner_id=current_user.id,
        title=data.title,
        description=data.description,
        city=data.city,
        budget_total=data.budget_total,
        timeline_json=data.timeline_json,
        status="draft",
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    log_action(
        db, actor=current_user, action="project.create",
        entity_type="project", entity_id=project.id,
        new_value=project_to_dict(project),
    )

    return _project_out(project)


@router.get("")
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    projects = db.query(Project).filter(
        Project.owner_id == current_user.id
    ).order_by(desc(Project.created_at)).all()

    return [_project_out(p) for p in projects]


@router.get("/{project_id}")
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id and (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not your project")

    return _project_out(project)


@router.put("/{project_id}")
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id and (current_user.system_role or "user") not in ("admin",):
        raise HTTPException(status_code=403, detail="Not your project")

    old = project_to_dict(project)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)

    log_action(
        db, actor=current_user, action="project.update",
        entity_type="project", entity_id=project.id,
        old_value=old, new_value=project_to_dict(project),
    )

    return _project_out(project)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id and (current_user.system_role or "user") not in ("admin",):
        raise HTTPException(status_code=403, detail="Not your project")

    old = project_to_dict(project)
    project.status = "archived"
    project.updated_at = datetime.utcnow()
    db.commit()

    log_action(
        db, actor=current_user, action="project.archive",
        entity_type="project", entity_id=project.id,
        old_value=old, new_value=project_to_dict(project),
    )

    return {"detail": "Project archived"}
