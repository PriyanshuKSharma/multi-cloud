"""
Billing and Cost API Endpoints
Provides cost analytics and billing information
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.user import User
from app.models.resource_inventory import CostData
from app.api.deps import get_current_user
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/costs")
def get_cost_data(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    group_by: Optional[str] = Query("service", description="Group by: service, provider, or day"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cost data with optional date range and grouping
    
    Returns:
        - Total cost for period
        - Breakdown by service/provider
        - Daily trend if applicable
    """
    try:
        # Default to last 30 days if no dates provided
        if not end_date:
            end_date = datetime.utcnow().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # Parse dates
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        
        # Query cost data
        query = db.query(CostData).filter(
            CostData.user_id == current_user.id,
            CostData.period_start >= start_dt,
            CostData.period_end <= end_dt
        )
        
        if provider:
            query = query.filter(CostData.provider == provider.lower())
        
        cost_records = query.all()
        
        # Calculate total
        total_cost = sum(c.cost_amount for c in cost_records)
        
        # Group data
        breakdown = []
        
        if group_by == 'service':
            service_costs = {}
            for cost in cost_records:
                service = cost.service_name or 'Other'
                if service not in service_costs:
                    service_costs[service] = {'service': service, 'cost': 0, 'provider': cost.provider.upper()}
                service_costs[service]['cost'] += cost.cost_amount
            breakdown = list(service_costs.values())
            
        elif group_by == 'provider':
            provider_costs = {}
            for cost in cost_records:
                prov = cost.provider.upper()
                if prov not in provider_costs:
                    provider_costs[prov] = {'provider': prov, 'cost': 0}
                provider_costs[prov]['cost'] += cost.cost_amount
            breakdown = list(provider_costs.values())
            
        elif group_by == 'day':
            daily_costs = {}
            for cost in cost_records:
                day = cost.period_start.strftime('%Y-%m-%d')
                if day not in daily_costs:
                    daily_costs[day] = {'date': day, 'cost': 0}
                daily_costs[day]['cost'] += cost.cost_amount
            breakdown = sorted(daily_costs.values(), key=lambda x: x['date'])
        
        # Round costs
        for item in breakdown:
            if 'cost' in item:
                item['cost'] = round(item['cost'], 2)
        
        return {
            'period': {
                'start': start_date,
                'end': end_date
            },
            'total_cost': round(total_cost, 2),
            'currency': 'USD',
            'breakdown': breakdown,
            'group_by': group_by
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching cost data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching cost data: {str(e)}")


@router.get("/summary")
def get_cost_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cost summary for current month and last month
    """
    try:
        now = datetime.utcnow()
        
        # Current month
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_costs = db.query(CostData).filter(
            CostData.user_id == current_user.id,
            CostData.period_start >= current_month_start
        ).all()
        current_month_total = sum(c.cost_amount for c in current_month_costs)
        
        # Last month
        last_month_end = current_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        last_month_costs = db.query(CostData).filter(
            CostData.user_id == current_user.id,
            CostData.period_start >= last_month_start,
            CostData.period_end <= last_month_end
        ).all()
        last_month_total = sum(c.cost_amount for c in last_month_costs)
        
        # Calculate change
        if last_month_total > 0:
            change_percent = ((current_month_total - last_month_total) / last_month_total) * 100
        else:
            change_percent = 0 if current_month_total == 0 else 100
        
        return {
            'current_month': {
                'period': current_month_start.strftime('%Y-%m'),
                'total': round(current_month_total, 2)
            },
            'last_month': {
                'period': last_month_start.strftime('%Y-%m'),
                'total': round(last_month_total, 2)
            },
            'change_percent': round(change_percent, 2),
            'currency': 'USD'
        }
        
    except Exception as e:
        logger.error(f"Error fetching cost summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching cost summary: {str(e)}")
