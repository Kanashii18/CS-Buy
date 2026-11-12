export function notification_network(io, socket, userId) {
    // read and notification unread notifications...
    socket.on('unread_check', async (unread_count) => {
        if (unread_count.receiver === userId) {
            io.to(socket.id).emit('unread_check', unread_count);
        }
    });
    // Send notification
    socket.on("notification", (notice) => {
        if (notice.receiver === userId) {
            io.to(socket.id).emit('notification', notice);
        }
    });
}
