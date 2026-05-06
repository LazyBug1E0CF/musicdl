from fastapi import FastAPI

from webapi.api.v1.playback import router as playback_router
from webapi.api.v1.lyrics import router as lyrics_router

app = FastAPI(title="musicdl webapi")
app.include_router(playback_router)
app.include_router(lyrics_router)
