from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


# ──────────────────────────────────────────────
# USER
# ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # product role: client, contractor, supplier-materials
    system_role = Column(String, default="user")  # user, moderator, admin
    company_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(Text, nullable=True)

    is_banned = Column(Boolean, default=False)
    ban_reason = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)

    interface_lang = Column(String, default="ru")
    currency_format = Column(String, default="KZT")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notifications = relationship("Notification", back_populates="user")
    listings = relationship("Listing", back_populates="owner", foreign_keys="Listing.owner_id")
    projects = relationship("Project", back_populates="owner")


# ──────────────────────────────────────────────
# LEGACY — kept for migration compatibility
# ──────────────────────────────────────────────
class EstateObject(Base):
    __tablename__ = "estates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    city = Column(String, index=True)
    district = Column(String, index=True)
    residential_complex = Column(String, index=True, nullable=True)
    price_kzt = Column(Float)
    rooms = Column(Integer)
    area_sqm = Column(Float)
    floor = Column(Integer)
    total_floors = Column(Integer)
    image_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    metadata_json = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ──────────────────────────────────────────────
# LISTING (replaces EstateObject conceptually)
# ──────────────────────────────────────────────
class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    city = Column(String, index=True)
    district = Column(String, index=True, nullable=True)
    residential_complex = Column(String, nullable=True)
    address = Column(String, nullable=True)
    price_kzt = Column(Float)
    rooms = Column(Integer, nullable=True)
    area_sqm = Column(Float, nullable=True)
    floor = Column(Integer, nullable=True)
    total_floors = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_url = Column(String, nullable=True)
    images_json = Column(JSON, nullable=True)  # array of image URLs
    metadata_json = Column(JSON, default={})

    # Moderation
    status = Column(String, default="draft", index=True)
    # draft | pending_review | approved | rejected | needs_changes | archived | removed
    moderation_comment = Column(Text, nullable=True)
    moderated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    moderated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="listings", foreign_keys=[owner_id])
    moderator = relationship("User", foreign_keys=[moderated_by])


# ──────────────────────────────────────────────
# PROJECT
# ──────────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft, active, completed, archived
    budget_total = Column(Float, nullable=True)
    timeline_json = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    estimates = relationship("Estimate", back_populates="project")
    files = relationship("FileRecord", back_populates="project")


# ──────────────────────────────────────────────
# ESTIMATE / BOQ
# ──────────────────────────────────────────────
class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    version = Column(Integer, default=1)
    tier = Column(String, default="standard")  # economy, standard, premium
    items_json = Column(JSON)  # array of BOQ line items
    total_cost = Column(Float)
    tax_amount = Column(Float, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    source_file_id = Column(Integer, ForeignKey("files.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="estimates")
    owner = relationship("User")


# ──────────────────────────────────────────────
# CONTRACTOR
# ──────────────────────────────────────────────
class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String)
    specializations = Column(JSON, default=[])
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    portfolio_json = Column(JSON, nullable=True)
    city = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


# ──────────────────────────────────────────────
# SUPPLIER
# ──────────────────────────────────────────────
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String)
    catalog_json = Column(JSON, default=[])
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    city = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


# ──────────────────────────────────────────────
# RFQ (Request For Quotation)
# ──────────────────────────────────────────────
class RFQRequest(Base):
    __tablename__ = "rfq_requests"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contractor_id = Column(Integer, ForeignKey("contractors.id"), nullable=True)
    scope = Column(Text)
    budget_range = Column(String, nullable=True)
    status = Column(String, default="open")  # open, quoted, accepted, rejected

    created_at = Column(DateTime, default=datetime.utcnow)

    requester = relationship("User")
    contractor = relationship("Contractor")
    project = relationship("Project")
    quotes = relationship("RFQQuote", back_populates="rfq")


class RFQQuote(Base):
    __tablename__ = "rfq_quotes"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfq_requests.id"), nullable=False)
    contractor_id = Column(Integer, ForeignKey("contractors.id"), nullable=False)
    amount = Column(Float)
    timeline_days = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="submitted")  # submitted, accepted, rejected

    created_at = Column(DateTime, default=datetime.utcnow)

    rfq = relationship("RFQRequest", back_populates="quotes")
    contractor = relationship("Contractor")


# ──────────────────────────────────────────────
# SUPPLY REQUESTS (Suppliers)
# ──────────────────────────────────────────────
class SupplyRequest(Base):
    __tablename__ = "supply_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    items_json = Column(JSON, default=[])
    budget_range = Column(String, nullable=True)
    status = Column(String, default="open")  # open, quoted, accepted, rejected

    created_at = Column(DateTime, default=datetime.utcnow)

    requester = relationship("User")
    supplier = relationship("Supplier")
    quotes = relationship("SupplyQuote", back_populates="request")


class SupplyQuote(Base):
    __tablename__ = "supply_quotes"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("supply_requests.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    amount = Column(Float)
    notes = Column(Text, nullable=True)
    status = Column(String, default="submitted")  # submitted, accepted, rejected

    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("SupplyRequest", back_populates="quotes")
    supplier = relationship("Supplier")


# ──────────────────────────────────────────────
# FILE
# ──────────────────────────────────────────────
class FileRecord(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    filename = Column(String)
    file_type = Column(String)  # blueprint, document, image, other
    file_path = Column(String)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")
    project = relationship("Project", back_populates="files")


# ──────────────────────────────────────────────
# NOTIFICATION (extended)
# ──────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    content = Column(Text)
    type = Column(String)  # system, project, ai, moderation
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    entity_type = Column(String, nullable=True)  # listing, project, estimate
    entity_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


# ──────────────────────────────────────────────
# COMPLAINT
# ──────────────────────────────────────────────
class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entity_type = Column(String)  # listing, user, contractor
    entity_id = Column(Integer)
    reason = Column(Text)
    status = Column(String, default="open")  # open, investigating, resolved, dismissed
    resolution = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    reporter = relationship("User", foreign_keys=[reporter_id])
    resolver = relationship("User", foreign_keys=[resolved_by])


# ──────────────────────────────────────────────
# AUDIT LOG (IMMUTABLE)
# ──────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    actor_email = Column(String)
    action = Column(String, index=True)  # listing.create, user.ban, estimate.export, etc.
    entity_type = Column(String, index=True)
    entity_id = Column(Integer, nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    actor = relationship("User")
