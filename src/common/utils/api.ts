import request = require('request');
import Agent = require('socks5-http-client/lib/Agent');
import { Settings } from '../config/settings.service';

export class API {
    public static mergeRequest(request, settings: Settings) {
        return {
            baseUrl: settings.SwaggerEndpoint,
            headers: {
                "Authorization": `${settings.SwaggerApiKey}`,
                "Content-Type": "application/json"
            },
            agentClass: Agent,
            agentOptions: {
                socksHost: settings.OnionSocksHost,
                socksPort: settings.OnionSocksPort
            },
            ...request
        };
    };
    
    public static post(req, settings: Settings, callback: request.RequestCallback) {
        return request.post(
            API.mergeRequest(req, settings),
            callback
        );
    }
}
