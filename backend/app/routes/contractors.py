from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Contractor
from app.schemas import ContractorRegister, ContractorLogin, ContractorOut, TokenResponse
from app.core.auth import hash_password, verify_password, create_token, get_current_contractor

router = APIRouter(prefix="/contractors", tags=["contractors"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: ContractorRegister, db: Session = Depends(get_db)):
    if db.query(Contractor).filter(Contractor.phone == body.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    contractor = Contractor(
        name=body.name,
        phone=body.phone,
        company_name=body.company_name,
        city=body.city,
        business_type=body.business_type,
        password_hash=hash_password(body.password),
    )
    db.add(contractor)
    db.commit()
    db.refresh(contractor)
    token = create_token({"sub": str(contractor.contractor_id), "role": "contractor"})
    return TokenResponse(access_token=token, contractor=ContractorOut.model_validate(contractor))


@router.post("/login", response_model=TokenResponse)
def login(body: ContractorLogin, db: Session = Depends(get_db)):
    contractor = db.query(Contractor).filter(Contractor.phone == body.phone).first()
    if not contractor or not verify_password(body.password, contractor.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    if not contractor.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    token = create_token({"sub": str(contractor.contractor_id), "role": "contractor"})
    return TokenResponse(access_token=token, contractor=ContractorOut.model_validate(contractor))


@router.get("/me", response_model=ContractorOut)
def me(contractor: Contractor = Depends(get_current_contractor)):
    return ContractorOut.model_validate(contractor)
