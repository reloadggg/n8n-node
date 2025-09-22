import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ThreeZeroTwoAIApi implements ICredentialType {
	name = 'threeZeroTwoAIApi';
	icon = {
		light: 'file:../nodes/ThreeZeroTwoAi/aiThreeZeroTwo.svg' as const,
		dark: 'file:../nodes/ThreeZeroTwoAi/aiThreeZeroTwo.svg' as const,
	};
	displayName = '302.AI API';
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
			description: '302.AI API key with access to chat models.',
		},
	];
}


