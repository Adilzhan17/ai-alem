"""
Qal.ai Seed Script — populates all tables with demo data.
Run: python seed.py  (from backend/ directory)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from app.db.base import SessionLocal, engine, Base
from app.models.estate import (
    User, EstateObject, Listing, Project, Estimate, Contractor,
    Supplier, Notification, AuditLog, Complaint, FileRecord,
)
from app.core.security import get_password_hash

# Recreate all tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("🗑️  Dropped all tables")
print("🔨 Creating tables...")
print("🌱 Seeding data...")

# ══════════════════════════════════════════════
# USERS
# ══════════════════════════════════════════════
users_data = [
    {"email": "admin@qal.ai", "password": "admin123", "full_name": "Администратор Qal.ai",
     "role": "client", "system_role": "admin", "company_name": "Qal.ai", "is_verified": True},
    {"email": "mod@qal.ai", "password": "mod123", "full_name": "Модератор Асель",
     "role": "client", "system_role": "moderator", "company_name": "Qal.ai", "is_verified": True},
    {"email": "client@test.io", "password": "password123", "full_name": "Данияр Касымов",
     "role": "client", "system_role": "user"},
    {"email": "build@test.io", "password": "password123", "full_name": "Tехстрой Алматы",
     "role": "contractor", "system_role": "user", "company_name": "ТОО ТехСтрой"},
    {"email": "supplier@test.io", "password": "password123", "full_name": "КазМатериал",
     "role": "supplier-materials", "system_role": "user", "company_name": "ТОО КазМатериал"},
    {"email": "arman@test.io", "password": "password123", "full_name": "Арман Нурланов",
     "role": "contractor", "system_role": "user", "company_name": "НурБилд"},
    {"email": "aida@test.io", "password": "password123", "full_name": "Аида Сериковна",
     "role": "client", "system_role": "user"},
]

created_users = []
for u in users_data:
    user = User(
        email=u["email"],
        hashed_password=get_password_hash(u["password"]),
        full_name=u["full_name"],
        role=u["role"],
        system_role=u["system_role"],
        company_name=u.get("company_name"),
        is_banned=False,
        is_verified=u.get("is_verified", False),
        interface_lang="ru",
        currency_format="KZT",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    created_users.append(user)
    print(f"  ✅ User: {user.email} ({user.system_role})")

admin, mod, client, contractor_user, supplier_user, arman, aida = created_users

# ══════════════════════════════════════════════
# LEGACY ESTATE OBJECTS (for search compatibility)
# ══════════════════════════════════════════════
estates = [
    {"title": "3-комн. квартира в ЖК Highvill", "description": "Современная квартира с панорамным видом",
     "city": "Астана", "district": "Есильский", "residential_complex": "Highvill",
     "price_kzt": 42000000, "rooms": 3, "area_sqm": 95.0, "floor": 14, "total_floors": 25,
     "latitude": 51.1282, "longitude": 71.4307,
     "image_url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"},
    {"title": "2-комн. квартира у парка", "description": "Рядом с Central Park Almaty",
     "city": "Алматы", "district": "Бостандыкский", "residential_complex": "Central Park",
     "price_kzt": 38500000, "rooms": 2, "area_sqm": 72.0, "floor": 8, "total_floors": 16,
     "latitude": 43.2389, "longitude": 76.9455,
     "image_url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"},
    {"title": "Пентхаус в Abu Dhabi Plaza", "description": "Премиальный пентхаус в центре столицы",
     "city": "Астана", "district": "Есильский", "residential_complex": "Abu Dhabi Plaza",
     "price_kzt": 120000000, "rooms": 5, "area_sqm": 220.0, "floor": 30, "total_floors": 35,
     "latitude": 51.1289, "longitude": 71.4306,
     "image_url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"},
    {"title": "Студия в Green Quarter", "description": "Компактная студия для молодых профессионалов",
     "city": "Алматы", "district": "Медеуский", "residential_complex": None,
     "price_kzt": 18500000, "rooms": 1, "area_sqm": 38.0, "floor": 5, "total_floors": 12,
     "latitude": 43.2567, "longitude": 76.9286,
     "image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"},
    {"title": "4-комн. квартира в ЖК Байконур", "description": "Семейная квартира рядом со школой",
     "city": "Астана", "district": "Байконур", "residential_complex": "ЖК Байконур",
     "price_kzt": 55000000, "rooms": 4, "area_sqm": 130.0, "floor": 10, "total_floors": 18,
     "latitude": 51.1435, "longitude": 71.4412,
     "image_url": "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400"},
]

for e in estates:
    obj = EstateObject(**e, metadata_json={})
    db.add(obj)
db.commit()
print(f"  ✅ {len(estates)} legacy estate objects")

# ══════════════════════════════════════════════
# LISTINGS (with moderation statuses)
# ══════════════════════════════════════════════
listings_data = [
    {"owner": client, "title": "3-комн. квартира в ЖК Highvill", "city": "Астана",
     "district": "Есильский", "price_kzt": 42000000, "rooms": 3, "area_sqm": 95.0,
     "status": "approved", "latitude": 51.1282, "longitude": 71.4307,
     "image_url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"},
    {"owner": client, "title": "2-комн. рядом с Central Park", "city": "Алматы",
     "district": "Бостандыкский", "price_kzt": 38500000, "rooms": 2, "area_sqm": 72.0,
     "status": "approved", "latitude": 43.2389, "longitude": 76.9455,
     "image_url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"},
    {"owner": aida, "title": "Студия в Green Quarter", "city": "Алматы",
     "district": "Медеуский", "price_kzt": 18500000, "rooms": 1, "area_sqm": 38.0,
     "status": "approved", "latitude": 43.2567, "longitude": 76.9286,
     "image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"},
    {"owner": aida, "title": "Пентхаус Abu Dhabi Plaza", "city": "Астана",
     "district": "Есильский", "price_kzt": 120000000, "rooms": 5, "area_sqm": 220.0,
     "status": "pending_review", "latitude": 51.1289, "longitude": 71.4306,
     "image_url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"},
    {"owner": client, "title": "Черновик: дом в Караганде", "city": "Караганда",
     "district": "Казыбек Би", "price_kzt": 30000000, "rooms": 4, "area_sqm": 150.0,
     "status": "draft"},
    {"owner": arman, "title": "Отклонено: офис без документов", "city": "Астана",
     "district": "Сарыарка", "price_kzt": 75000000, "rooms": 0, "area_sqm": 200.0,
     "status": "rejected", "moderation_comment": "Отсутствуют правоустанавливающие документы"},
]

for ld in listings_data:
    owner = ld.pop("owner")
    listing = Listing(owner_id=owner.id, **ld)
    if ld["status"] in ("approved", "rejected"):
        listing.moderated_by = mod.id
        listing.moderated_at = datetime.utcnow()
    db.add(listing)
db.commit()
print(f"  ✅ {len(listings_data)} listings (various statuses)")

# ══════════════════════════════════════════════
# CONTRACTORS
# ══════════════════════════════════════════════
contractors_data = [
    {"user_id": contractor_user.id, "company_name": "ТОО ТехСтрой",
     "specializations": ["Бетонные работы", "Фундамент", "Каркас"],
     "rating": 4.8, "rating_count": 156, "is_verified": True,
     "description": "Ведущая строительная компания Алматы с 15-летним опытом",
     "city": "Алматы"},
    {"user_id": arman.id, "company_name": "НурБилд",
     "specializations": ["Отделка", "Дизайн интерьера", "Электрика"],
     "rating": 4.5, "rating_count": 89, "is_verified": True,
     "description": "Премиальная отделка квартир и домов",
     "city": "Астана"},
]

for cd in contractors_data:
    c = Contractor(**cd)
    db.add(c)
db.commit()
print(f"  ✅ {len(contractors_data)} contractors")

# ══════════════════════════════════════════════
# SUPPLIERS
# ══════════════════════════════════════════════
supplier_obj = Supplier(
    user_id=supplier_user.id,
    company_name="ТОО КазМатериал",
    catalog_json=[
        {"name": "Бетон M400", "price_per_unit": 54000, "unit": "м³"},
        {"name": "Арматура A500C", "price_per_unit": 380000, "unit": "тонна"},
        {"name": "Кирпич облицовочный", "price_per_unit": 145, "unit": "шт"},
    ],
    rating=4.6, rating_count=72, is_verified=True, city="Алматы",
)
db.add(supplier_obj)
db.commit()
print("  ✅ 1 supplier")

# ══════════════════════════════════════════════
# PROJECTS
# ══════════════════════════════════════════════
project1 = Project(
    owner_id=client.id,
    title="Ремонт квартиры в ЖК Highvill",
    description="Капитальный ремонт 3-комн. квартиры, 95 м²",
    city="Астана",
    status="active",
    budget_total=15000000,
    timeline_json={"start": "2026-03-01", "end": "2026-06-01",
                   "milestones": ["Демонтаж", "Черновая", "Чистовая", "Мебель"]},
)
project2 = Project(
    owner_id=aida.id,
    title="Дизайн студии в Green Quarter",
    description="Дизайн-проект и отделка студии 38 м²",
    city="Алматы",
    status="draft",
    budget_total=5000000,
)
db.add_all([project1, project2])
db.commit()
db.refresh(project1)
print("  ✅ 2 projects")

# ══════════════════════════════════════════════
# ESTIMATES
# ══════════════════════════════════════════════
est1 = Estimate(
    project_id=project1.id,
    owner_id=client.id,
    version=1,
    tier="standard",
    items_json=[
        {"item": "Штукатурка стен", "quantity": 285, "unit": "м²", "price": 2500, "total": 712500},
        {"item": "Укладка ламината", "quantity": 95, "unit": "м²", "price": 4500, "total": 427500},
        {"item": "Электроточки", "quantity": 24, "unit": "шт", "price": 5000, "total": 120000},
        {"item": "Сантехника", "quantity": 6, "unit": "шт", "price": 12000, "total": 72000},
    ],
    total_cost=1332000,
    tax_amount=159840,
    ai_confidence=0.94,
    ai_explanation="Расчет на основе стандартных расценок Астаны Q1 2026",
)
db.add(est1)
db.commit()
print("  ✅ 1 estimate")

# ══════════════════════════════════════════════
# NOTIFICATIONS
# ══════════════════════════════════════════════
notifs = [
    Notification(user_id=client.id, title="Добро пожаловать в Qal.ai! 🎉",
                 content="Ваш аккаунт создан. Начните поиск недвижимости.", type="system"),
    Notification(user_id=client.id, title="Объявление одобрено ✅",
                 content="Ваше объявление «3-комн. квартира в ЖК Highvill» опубликовано.",
                 type="moderation", entity_type="listing", entity_id=1),
    Notification(user_id=aida.id, title="Ожидает модерации 📝",
                 content="Ваше объявление «Пентхаус Abu Dhabi Plaza» отправлено на проверку.",
                 type="moderation", entity_type="listing", entity_id=4),
    Notification(user_id=mod.id, title="Новое объявление на модерации",
                 content="Пентхаус Abu Dhabi Plaza ожидает проверки.",
                 type="moderation", link="/backoffice/listings"),
]
for n in notifs:
    db.add(n)
db.commit()
print(f"  ✅ {len(notifs)} notifications")

# ══════════════════════════════════════════════
# AUDIT LOG
# ══════════════════════════════════════════════
audit_entries = [
    AuditLog(actor_id=admin.id, actor_email=admin.email, action="system.seed",
             entity_type="system", entity_id=0,
             metadata_json={"note": "Database seeded with demo data"},
             created_at=datetime.utcnow() - timedelta(hours=2)),
    AuditLog(actor_id=mod.id, actor_email=mod.email, action="moderation.approve",
             entity_type="listing", entity_id=1,
             new_value={"title": "3-комн. квартира в ЖК Highvill", "status": "approved"},
             created_at=datetime.utcnow() - timedelta(hours=1)),
    AuditLog(actor_id=mod.id, actor_email=mod.email, action="moderation.approve",
             entity_type="listing", entity_id=2,
             new_value={"title": "2-комн. рядом с Central Park", "status": "approved"},
             created_at=datetime.utcnow() - timedelta(minutes=30)),
    AuditLog(actor_id=mod.id, actor_email=mod.email, action="moderation.reject",
             entity_type="listing", entity_id=6,
             metadata_json={"reason": "Отсутствуют правоустанавливающие документы"},
             created_at=datetime.utcnow() - timedelta(minutes=15)),
]
for a in audit_entries:
    db.add(a)
db.commit()
print(f"  ✅ {len(audit_entries)} audit log entries")

db.close()

print("\n" + "=" * 50)
print("✅ SEED COMPLETE!")
print("=" * 50)
print("\n📋 Demo accounts:")
print("  Admin:      admin@qal.ai / admin123")
print("  Moderator:  mod@qal.ai / mod123")
print("  Client:     client@test.io / password123")
print("  Contractor: build@test.io / password123")
print("  Supplier:   supplier@test.io / password123")
print("  Client 2:   aida@test.io / password123")
print()
