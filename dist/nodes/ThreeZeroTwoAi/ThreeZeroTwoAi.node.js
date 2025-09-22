"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreeZeroTwoAi = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class ThreeZeroTwoAi {
    constructor() {
        this.description = {
            displayName: '302.AI',
            name: 'threeZeroTwoAi',
            icon: { light: 'file:aiThreeZeroTwo.svg', dark: 'file:aiThreeZeroTwo.svg' },
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'Interact with 302.AI AI services',
            defaults: {
                name: '302.AI',
            },
            inputs: ["main"],
            outputs: ["main"],
            credentials: [
                {
                    name: 'threeZeroTwoAIApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Chat',
                            value: 'chat',
                            description: 'Send a chat message',
                            action: 'Send a chat message',
                        },
                    ],
                    default: 'chat',
                },
                {
                    displayName: 'Model Name or ID',
                    name: 'model',
                    type: 'options',
                    noDataExpression: true,
                    typeOptions: {
                        loadOptionsMethod: 'getModels',
                    },
                    required: true,
                    default: '',
                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                },
                {
                    displayName: 'System Prompt',
                    name: 'system_prompt',
                    type: 'string',
                    typeOptions: {
                        rows: 4,
                    },
                    default: '',
                    description: 'System message to set the behavior of the assistant',
                    placeholder: 'You are a helpful assistant...',
                },
                {
                    displayName: 'Message',
                    name: 'message',
                    type: 'string',
                    typeOptions: {
                        rows: 4,
                    },
                    default: '',
                    description: 'The message to send to the chat model',
                    required: true,
                },
                {
                    displayName: 'Image URL',
                    name: 'imageUrl',
                    type: 'string',
                    default: '',
                    description: 'Optional image URL. Supports http/https links or base64-encoded data URLs.',
                    placeholder: 'https://example.com/image.jpg or data:image/jpeg;base64,...',
                },
                {
                    displayName: 'Temperature',
                    name: 'temperature',
                    type: 'number',
                    default: 0.9,
                    description: 'Sampling temperature to use for the chat completion',
                },
                {
                    displayName: 'Additional Fields',
                    name: 'additionalFields',
                    type: 'collection',
                    placeholder: 'Add Field',
                    default: {},
                    options: [
                        {
                            displayName: 'Frequency Penalty',
                            name: 'frequency_penalty',
                            type: 'number',
                            default: 0,
                            description: 'Number between -2.0 and 2.0. Positive values penalize frequent tokens.',
                        },
                        {
                            displayName: 'Max Tokens',
                            name: 'max_tokens',
                            type: 'number',
                            default: 1000,
                            description: 'Maximum number of tokens to generate in the response',
                        },
                        {
                            displayName: 'Presence Penalty',
                            name: 'presence_penalty',
                            type: 'number',
                            default: 0,
                            description: 'Number between -2.0 and 2.0. Positive values penalize novel tokens.',
                        },
                        {
                            displayName: 'Top P',
                            name: 'top_p',
                            type: 'number',
                            default: 1,
                            description: 'Alternative to temperature sampling using nucleus sampling',
                        },
                    ],
                },
            ],
        };
        this.methods = {
            loadOptions: {
                async getModels() {
                    const credentials = await this.getCredentials('threeZeroTwoAIApi');
                    if (!(credentials === null || credentials === void 0 ? void 0 : credentials.apiKey)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'API key is required to load models');
                    }
                    const requestOptions = {
                        url: 'https://api.302.ai/v1/models?llm=1',
                        headers: {
                            Authorization: `Bearer ${credentials.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        method: 'GET',
                        json: true,
                    };
                    try {
                        const response = (await this.helpers.request(requestOptions));
                        if (!Array.isArray(response === null || response === void 0 ? void 0 : response.data)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid response format from 302.AI API');
                        }
                        const models = response.data
                            .map((model) => ({
                            name: model.id,
                            value: model.id,
                            description: model.owned_by ? `Owned by: ${model.owned_by}` : undefined,
                        }))
                            .sort((a, b) => a.name.localeCompare(b.name));
                        if (models.length === 0) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No models found in 302.AI API response');
                        }
                        return models;
                    }
                    catch (error) {
                        const message = error instanceof Error ? error.message : 'Unknown error';
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to load models: ${message}`);
                    }
                },
            },
        };
    }
    async execute() {
        var _a, _b, _c, _d;
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('threeZeroTwoAIApi');
        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.apiKey)) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No valid API key provided');
        }
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const operation = this.getNodeParameter('operation', itemIndex);
                if (operation !== 'chat') {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`);
                }
                const model = this.getNodeParameter('model', itemIndex);
                const systemPrompt = this.getNodeParameter('system_prompt', itemIndex, '');
                const message = this.getNodeParameter('message', itemIndex);
                const temperature = this.getNodeParameter('temperature', itemIndex);
                const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {});
                const imageUrl = this.getNodeParameter('imageUrl', itemIndex, '');
                const messages = [];
                if (systemPrompt) {
                    messages.push({
                        role: 'system',
                        content: systemPrompt,
                    });
                }
                const userMessage = {
                    role: 'user',
                    content: message,
                };
                if (imageUrl) {
                    userMessage.content = [
                        { type: 'text', text: message },
                        { type: 'image_url', image_url: { url: imageUrl } },
                    ];
                }
                messages.push(userMessage);
                const requestBody = {
                    model,
                    messages,
                    temperature,
                    ...additionalFields,
                };
                const requestOptions = {
                    url: 'https://api.302.ai/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${credentials.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: requestBody,
                    json: true,
                };
                const response = (await this.helpers.request(requestOptions));
                const messageContent = (_d = (_c = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim();
                if (!messageContent) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid response format from 302.AI API');
                }
                returnData.push({
                    json: {
                        response: messageContent,
                    },
                    pairedItem: { item: itemIndex },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    returnData.push({
                        json: {
                            error: message,
                        },
                        pairedItem: { item: itemIndex },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.ThreeZeroTwoAi = ThreeZeroTwoAi;
//# sourceMappingURL=ThreeZeroTwoAi.node.js.map