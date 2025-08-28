import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ThreeZeroTwoAIApi implements ICredentialType {
	name = 'threeZeroTwoAIApi';
	displayName = '302.ai API';

	documentationUrl = 'https://302.ai/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The 302.ai API key for accessing OpenAI services',
		},
	];
}