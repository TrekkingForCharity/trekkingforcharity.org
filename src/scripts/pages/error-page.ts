import { inject, injectable } from 'inversify';
import { INFRASTRUCTURE_TYPES, IPage, SERVICE_TYPES } from '../constructs';
import { IRouter } from '../infrastructure';
import { IPageContentService } from '../services';
import { BasePage } from './base-page';

@injectable()
export class ErrorPage extends BasePage implements IPage {
    public readonly requiresAuthentication: boolean = false;

    protected viewName: string = 'error.partial';
    protected bodyClasses: string[];

    constructor(
        @inject(SERVICE_TYPES.PageContentService) pageContentService: IPageContentService,
        @inject(INFRASTRUCTURE_TYPES.Router) router: IRouter,
    ) {
        super(pageContentService, router);
    }

    public canNavigateTo(): Promise<void> {
        return Promise.resolve();
    }

    public canNavigateFrom(): Promise<void> {
        return Promise.resolve();
    }
}
