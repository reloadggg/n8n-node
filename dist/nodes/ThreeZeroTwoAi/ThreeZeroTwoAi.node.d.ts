import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodeType, INodeTypeDescription, INodePropertyOptions } from 'n8n-workflow';
export declare class ThreeZeroTwoAi implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
