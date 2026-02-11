"""
Resource Inventory API Endpoints
Provides access to cached cloud resources (VMs, Storage, Networks)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.user import User
from app.models.resource_inventory import ResourceInventory
from app.api.deps import get_current_user
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/vms")
def get_virtual_machines(
    provider: Optional[str] = Query(None, description="Filter by provider (aws, azure, gcp)"),
    region: Optional[str] = Query(None, description="Filter by region"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all virtual machines from inventory with optional filters
    
    Returns list of VMs with:
    - resource_id, name, provider, region, status
    - instance_type, public_ip, private_ip
    - cost_per_hour, metadata, tags
    """
    try:
        query = db.query(ResourceInventory).filter(
            ResourceInventory.user_id == current_user.id,
            ResourceInventory.resource_type == 'vm'
        )
        
        # Apply filters
        if provider:
            query = query.filter(ResourceInventory.provider == provider.lower())
        if region:
            query = query.filter(ResourceInventory.region == region)
        if status:
            query = query.filter(ResourceInventory.status == status.lower())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        vms = query.order_by(ResourceInventory.last_synced_at.desc()).offset(skip).limit(limit).all()
        
        return {
            'total': total,
            'skip': skip,
            'limit': limit,
            'items': [
                {
                    'id': vm.id,
                    'resource_id': vm.resource_id,
                    'name': vm.resource_name,
                    'provider': vm.provider.upper(),
                    'region': vm.region,
                    'status': vm.status,
                    'instance_type': vm.instance_type,
                    'public_ip': vm.public_ip,
                    'private_ip': vm.private_ip,
                    'cost_per_hour': vm.cost_per_hour,
                    'created_at': vm.created_at.isoformat() if vm.created_at else None,
                    'last_synced_at': vm.last_synced_at.isoformat() if vm.last_synced_at else None,
                    'metadata': vm.resource_metadata,
                    'tags': vm.tags
                }
                for vm in vms
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching VMs: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching VMs: {str(e)}")


@router.get("/storage")
def get_storage_resources(
    provider: Optional[str] = Query(None, description="Filter by provider"),
    region: Optional[str] = Query(None, description="Filter by region"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all storage resources (S3 buckets, Blob containers, Cloud Storage buckets)
    """
    try:
        query = db.query(ResourceInventory).filter(
            ResourceInventory.user_id == current_user.id,
            ResourceInventory.resource_type == 'storage'
        )
        
        if provider:
            query = query.filter(ResourceInventory.provider == provider.lower())
        if region:
            query = query.filter(ResourceInventory.region == region)
        
        total = query.count()
        storage = query.order_by(ResourceInventory.last_synced_at.desc()).offset(skip).limit(limit).all()
        
        return {
            'total': total,
            'skip': skip,
            'limit': limit,
            'items': [
                {
                    'id': s.id,
                    'resource_id': s.resource_id,
                    'name': s.resource_name,
                    'provider': s.provider.upper(),
                    'region': s.region,
                    'status': s.status,
                    'created_at': s.created_at.isoformat() if s.created_at else None,
                    'last_synced_at': s.last_synced_at.isoformat() if s.last_synced_at else None,
                    'metadata': s.resource_metadata,
                    'tags': s.tags
                }
                for s in storage
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching storage resources: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching storage: {str(e)}")


@router.get("/networks")
def get_network_resources(
    provider: Optional[str] = Query(None, description="Filter by provider"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all network resources (VPCs, VNets, Networks)
    """
    try:
        query = db.query(ResourceInventory).filter(
            ResourceInventory.user_id == current_user.id,
            ResourceInventory.resource_type.in_(['vpc', 'network', 'resource_group'])
        )
        
        if provider:
            query = query.filter(ResourceInventory.provider == provider.lower())
        
        total = query.count()
        networks = query.order_by(ResourceInventory.last_synced_at.desc()).offset(skip).limit(limit).all()
        
        return {
            'total': total,
            'skip': skip,
            'limit': limit,
            'items': [
                {
                    'id': n.id,
                    'resource_id': n.resource_id,
                    'name': n.resource_name,
                    'provider': n.provider.upper(),
                    'type': n.resource_type,
                    'region': n.region,
                    'status': n.status,
                    'created_at': n.created_at.isoformat() if n.created_at else None,
                    'last_synced_at': n.last_synced_at.isoformat() if n.last_synced_at else None,
                    'metadata': n.resource_metadata,
                    'tags': n.tags
                }
                for n in networks
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching network resources: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching networks: {str(e)}")


@router.get("/{resource_id}")
def get_resource_detail(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific resource
    """
    try:
        resource = db.query(ResourceInventory).filter(
            ResourceInventory.id == resource_id,
            ResourceInventory.user_id == current_user.id
        ).first()
        
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        return {
            'id': resource.id,
            'resource_id': resource.resource_id,
            'name': resource.resource_name,
            'provider': resource.provider.upper(),
            'type': resource.resource_type,
            'region': resource.region,
            'status': resource.status,
            'instance_type': resource.instance_type,
            'public_ip': resource.public_ip,
            'private_ip': resource.private_ip,
            'cost_per_hour': resource.cost_per_hour,
            'created_at': resource.created_at.isoformat() if resource.created_at else None,
            'last_synced_at': resource.last_synced_at.isoformat() if resource.last_synced_at else None,
            'metadata': resource.resource_metadata,
            'tags': resource.tags
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching resource detail: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching resource: {str(e)}")
