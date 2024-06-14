from fastapi import HTTPException, status

AccountNotConnected = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Social Media Account is not connected",
)
ActiveCampaign = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Cannot Complete Operation on Active Campaign",
)
CampaignNotFound = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign Not Found")
CreatorNotUser = HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Token")
InvalidToken = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Unauthorized",
    headers={"WWW-Authenticate": "Bearer"},
)
InvalidState = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid State")
NotFound = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")
ProfileNotFound = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile Not Found")
ScheduleNotFound = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule Not Found")
SequenceNotFound = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sequence Not Found")
StepNotFound = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step Not Found")
ScheduleTimeBlockNotFound = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule Time Block Not Found")
TokenError = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="What is this a string of some sort?",
)
UserNotCreator = HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Token")
UserNotFound = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User Not Found")
UserNotOwner = HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not owner")
UserCreditLimitExceeded = HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="credit limit is exceeded")
NameAlreadyExists = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Same name already exists")
