import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .utils import get_unread_count


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope['user']

        if not user.is_authenticated or not user.is_superuser:
            await self.close()
            return

        self.group_name = f'notifications_{user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        unread_count = await database_sync_to_async(get_unread_count)(user)
        await self.send(text_data=json.dumps({
            'event': 'unread_count',
            'unread_count': unread_count,
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def notification_message(self, event):
        payload = {'event': event['event'], **event['data']}
        await self.send(text_data=json.dumps(payload))
