"""
Dashboard API Endpoints
Provides real-time statistics and metrics for the dashboard
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.user import User
from app.models.resource import Resource
from app.models.resource_inventory import CostData, ProviderHealth
from app.api.deps import get_current_user
from datetime import datetime, timedelta
from typing import Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:

    try:
        # 🔥 Get ONLY current user's resources
        inventory = db.query(Resource).all()

        # ✅ BASIC METRICS
        total_resources = len(inventory)

        active_vms = len([
            r for r in inventory
            if r.type == 'vm' and r.status and r.status.lower() == 'running'
        ])

        total_storage = len([
            r for r in inventory
            if r.type == 'storage'
        ])

        total_networks = len([
            r for r in inventory
            if r.type in ['vpc', 'network', 'resource_group']
        ])

        # ✅ PROVIDER BREAKDOWN
        provider_counts = {}

        for r in inventory:
            provider = (r.provider or "unknown").lower()

            if provider not in provider_counts:
                provider_counts[provider] = {
                    "count": 0,
                    "vms": 0,
                    "storage": 0
                }

            provider_counts[provider]["count"] += 1

            if r.type == "vm":
                provider_counts[provider]["vms"] += 1
            elif r.type == "storage":
                provider_counts[provider]["storage"] += 1

        provider_breakdown = [
            {
                "provider": p,
                "count": d["count"],
                "vms": d["vms"],
                "storage": d["storage"]
            }
            for p, d in provider_counts.items()
        ]

        # ✅ COST (LAST 30 DAYS)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        cost_data = db.query(CostData).filter(
            CostData.user_id == current_user.id,
            CostData.period_start >= thirty_days_ago
        ).all()

        total_cost = sum(c.cost_amount or 0 for c in cost_data)

        # COST BY PROVIDER
        cost_by_provider = {}

        for c in cost_data:
            provider = (c.provider or "unknown").lower()
            cost_by_provider[provider] = cost_by_provider.get(provider, 0) + (c.cost_amount or 0)

        cost_by_provider_list = [
            {"provider": p, "cost": round(v, 2)}
            for p, v in cost_by_provider.items()
        ]

        # COST BY SERVICE
        compute_keywords = ["ec2", "compute", "vm"]
        storage_keywords = ["s3", "storage", "bucket"]

        compute_cost = 0
        storage_cost = 0

        for c in cost_data:
            service = (c.service_name or "").lower()
            amount = c.cost_amount or 0

            if any(k in service for k in compute_keywords):
                compute_cost += amount
            elif any(k in service for k in storage_keywords):
                storage_cost += amount

        other_cost = total_cost - compute_cost - storage_cost

        cost_by_service = [
            {"service": "Compute", "cost": round(compute_cost, 2)},
            {"service": "Storage", "cost": round(storage_cost, 2)},
            {"service": "Other", "cost": round(other_cost, 2)}
        ]

        # ✅ REGION DISTRIBUTION
        region_counts = {}

        for r in inventory:
            region = r.region or "unknown"
            region_counts[region] = region_counts.get(region, 0) + 1

        region_distribution = [
            {"region": r, "count": c}
            for r, c in sorted(region_counts.items(), key=lambda x: x[1], reverse=True)
        ][:10]

        # ✅ PROVIDER HEALTH
        health_records = db.query(ProviderHealth).filter(
            ProviderHealth.user_id == current_user.id
        ).all()

        provider_health = [
            {
                "provider": (h.provider or "unknown").lower(),
                "status": h.status,
                "response_time_ms": h.response_time_ms,
                "last_check": h.last_check_at.isoformat() if h.last_check_at else None,
                "error_message": h.error_message
            }
            for h in health_records
        ]

        # ✅ RECENT ACTIVITY
        recent_resources = db.query(Resource).order_by(
            Resource.last_synced_at.desc()
        ).limit(10).all()

        recent_activity = [
            {
                "resource_name": r.name,
                "provider": (r.provider or "unknown").lower(),
                "type": r.type,
                "status": r.status,
                "region": r.region,
                "last_synced": r.last_synced_at.isoformat() if r.last_synced_at else None
            }
            for r in recent_resources
        ]

        return {
            "total_resources": total_resources,
            "active_vms": active_vms,
            "total_storage": total_storage,
            "total_networks": total_networks,
            "estimated_monthly_cost": round(total_cost, 2),
            "provider_breakdown": provider_breakdown,
            "cost_by_provider": cost_by_provider_list,
            "cost_by_service": cost_by_service,
            "region_distribution": region_distribution,
            "provider_health": provider_health,
            "recent_activity": recent_activity,
            "last_updated": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/trigger")
def trigger_manual_sync(
    current_user: User = Depends(get_current_user)
):
    from app.tasks.sync_tasks import sync_user_resources

    try:
        sync_user_resources.delay(current_user.id)

        return {
            "status": "success",
            "message": "Sync triggered",
            "user_id": current_user.id
        }

    except Exception as e:
        logger.error(f"Sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))