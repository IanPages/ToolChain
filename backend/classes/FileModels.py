from pydantic import BaseModel

class FileInfo(BaseModel):
    name: str
    count: int


class UploadResponse(BaseModel):
    message: str
    files_processed: int
    documents_indexed: int


class DeleteResponse(BaseModel):
    message: str
    file_deleted: str
    documents_removed: int