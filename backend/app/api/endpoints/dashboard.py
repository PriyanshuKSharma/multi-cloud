"""
Dashboard API Endpoints
Provides real-time statistics and metrics for the dashboard
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.base import get_db
from app.models.user import User
from app.models.resource_inventory import ResourceInventory, CostData, ProviderHealth
from app.api.deps import get_current_user
from datetime import datetime, timedelta
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get comprehensive dashboard statistics with real-time data
    
    Returns:
        - Total resources count
        - Active VMs count
        - Storage buckets count
        - Estimated monthly cost
        - Provider breakdown
        - Cost by service
        - Region distribution
        - Provider health status
    """
    try:
        # Get all resources from inventory
        inventory = db.query(ResourceInventory).filter(
            ResourceInventory.user_id == current_user.id
        ).all()
        
        # Calculate basic counts
        total_resources = len(inventory)
        active_vms = len([r for r in inventory if r.resource_type == 'vm' and r.status in ['running', 'RUNNING']])
        total_storage = len([r for r in inventory if r.resource_type == 'storage'])
        total_networks = len([r for r in inventory if r.resource_type in ['vpc', 'network', 'resource_group']])
        
        # Provider breakdown
        provider_counts = {}
        for resource in inventory:
            provider = resource.provider.upper()
            if provider not in provider_counts:
                provider_counts[provider] = {'count': 0, 'vms': 0, 'storage': 0}
            provider_counts[provider]['count'] += 1
            if resource.resource_type == 'vm':
                provider_counts[provider]['vms'] += 1
            elif resource.resource_type == 'storage':
                provider_counts[provider]['storage'] += 1
        
        provider_breakdown = [
            {
                'provider': provider,
                'count': data['count'],
                'vms': data['vms'],
                'storage': data['storage']
            }
            for provider, data in provider_counts.items()
        ]
        
        # Cost calculation (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        cost_data = db.query(CostData).filter(
            CostData.user_id == current_user.id,
            CostData.period_start >= thirty_days_ago
        ).all()
        
        # Calculate total cost
        total_cost = sum(c.cost_amount for c in cost_data)
        
        # Cost by provider
        cost_by_provider = {}
        for cost in cost_data:
            provider = cost.provider.upper()
            if provider not in cost_by_provider:
                cost_by_provider[provider] = 0
            cost_by_provider[provider] += cost.cost_amount
        
        cost_by_provider_list = [
            {'provider': provider, 'cost': round(cost, 2)}
            for provider, cost in cost_by_provider.items()
        ]
        
        # Cost by service
        cost_by_service = {}
        for cost in cost_data:
            service = cost.service_name or 'Other'
            if service not in cost_by_service:
                cost_by_service[service] = 0
            cost_by_service[service] += cost.cost_amount
        
        # Group into major categories
        compute_services = ['EC2', 'Compute', 'Virtual Machines', 'Compute Engine']
        storage_services = ['S3', 'Storage', 'Blob Storage', 'Cloud Storage']
        
        compute_cost = sum(cost for service, cost in cost_by_service.items() if any(s in service for s in compute_services))
        storage_cost = sum(cost for service, cost in cost_by_service.items() if any(s in service for s in storage_services))
        other_cost = total_cost - compute_cost - storage_cost
        
        cost_by_service_list = [
            {'service': 'Compute', 'cost': round(compute_cost, 2)},
            {'service': 'Storage', 'cost': round(storage_cost, 2)},
            {'service': 'Network & Other', 'cost': round(other_cost, 2)}
        ]
        
        # Region distribution
        region_counts = {}
        for resource in inventory:
            region = resource.region or 'unknown'
            region_counts[region] = region_counts.get(region, 0) + 1
        
        region_distribution = [
            {'region': region, 'count': count}
            for region, count in sorted(region_counts.items(), key=lambda x: x[1], reverse=True)
        ][:10]  # Top 10 regions
        
        # Provider health
        health_records = db.query(ProviderHealth).filter(
            ProviderHealth.user_id == current_user.id
        ).all()
        
        provider_health = [
            {
                'provider': h.provider.upper(),
                'status': h.status,
                'response_time_ms': h.response_time_ms,
                'last_check': h.last_check_at.isoformat() if h.last_check_at else None,
                'error_message': h.error_message
            }
            for h in health_records
        ]
        
        # Recent activity (last 10 synced resources)
        recent_resources = db.query(ResourceInventory).filter(
            ResourceInventory.user_id == current_user.id
        ).order_by(ResourceInventory.last_synced_at.desc()).limit(10).all()
        
        recent_activity = [
            {
                'resource_name': r.resource_name,
                'provider': r.provider.upper(),
                'type': r.resource_type,
                'status': r.status,
                'region': r.region,
                'last_synced': r.last_synced_at.isoformat() if r.last_synced_at else None
            }
            for r in recent_resources
        ]
        
        return {
            'total_resources': total_resources,
            'active_vms': active_vms,
            'total_storage': total_storage,
            'total_networks': total_networks,
            'estimated_monthly_cost': round(total_cost, 2),
            'provider_breakdown': provider_breakdown,
            'cost_by_provider': cost_by_provider_list,
            'cost_by_service': cost_by_service_list,
            'region_distribution': region_distribution,
            'provider_health': provider_health,
            'recent_activity': recent_activity,
            'last_updated': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")


@router.post("/sync/trigger")
def trigger_manual_sync(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger manual resource sync for the current user
    """
    from app.tasks.sync_tasks import sync_user_resources
    
    try:
        # Trigger async sync task
        sync_user_resources.delay(current_user.id)
        
        return {
            'status': 'success',
            'message': 'Resource sync triggered successfully',
            'user_id': current_user.id
        }
    except Exception as e:
        logger.error(f"Error triggering sync: {e}")
        raise HTTPException(status_code=500, detail=f"Error triggering sync: {str(e)}")
