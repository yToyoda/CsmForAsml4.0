using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace CsmForAsml.Hubs {
    public class CsmHub :Hub{
        public async Task SendMessage(string user, string message) {
            await Clients.Caller.SendAsync("ReceoveID", "Caller", Context.ConnectionId);
            await Clients.All.SendAsync("ReceiveMessage", user, message);
            var msg = user + message;
        }

        public async Task SendConnectId() {
            await Clients.Caller.SendAsync("ReceiveID", Context.ConnectionId);            
        }
    }
}
