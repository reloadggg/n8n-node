"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreeZeroTwoAIApi = void 0;
class ThreeZeroTwoAIApi {
    constructor() {
        this.name = 'threeZeroTwoAIApi';
        this.icon = {
            light: 'file:../nodes/ThreeZeroTwoAi/aiThreeZeroTwo.svg',
            dark: 'file:../nodes/ThreeZeroTwoAi/aiThreeZeroTwo.svg',
        };
        this.displayName = '302.AI API';
        this.documentationUrl = 'https://302.ai/';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: '302.AI API key with access to chat models.',
            },
        ];
    }
}
exports.ThreeZeroTwoAIApi = ThreeZeroTwoAIApi;
//# sourceMappingURL=ThreeZeroTwoAIApi.credentials.js.map