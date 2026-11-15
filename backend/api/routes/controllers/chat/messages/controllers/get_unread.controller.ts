import type { IdQuery } from "../../../../../types/request.type.ts";
import type {
     ChatDB,
     ChatParams,
} from "../../../../../types/chat/overview.type.ts";

export default async ({ db, request, reply }: ChatParams<unknown, IdQuery>) => {
     try {
          const userInfo = request.userInfo;
          const id = request.query?.id || userInfo?.id;

          if (!id) {
               return reply.code(400).send({ error: "Missing user id" });
          }

          const count_notice = await db<Array<{ unread_count: number }>>(
               `
               SELECT COUNT(*) AS unread_count
               FROM Notifications
               WHERE user_id = ? AND unread = TRUE
          `,
               [userInfo.id],
          );

          const noticeCount = count_notice?.[0]?.unread_count ?? 0;

          const response = await db<ChatDB.GetUnread[]>(
               `
               SELECT user_id, other_id, unread_count_user_1, unread_count_user_2
               FROM chat_user_room_status
               WHERE (user_id = ? OR other_id = ?)
          `,
               [id, id],
          );

          let totalUnread = 0;
          if (!response || response.length === 0) {
               return reply.code(200).send({ unread: 0, notice: noticeCount });
          } else {
               // Calculate the total unread messages for the user
               for (let row of response) {
                    if (row.user_id === id) {
                         totalUnread += row.unread_count_user_1 || 0;
                    }
                    if (row.other_id === id) {
                         totalUnread += row.unread_count_user_2 || 0;
                    }
               }
               return reply.code(200).send({
                    unread: totalUnread,
                    notice: noticeCount,
               });
          }
     } catch (err) {
          console.error("Error in get_unread controller:", err);
          return reply.code(500).send({ error: "Server error" });
     }
};
