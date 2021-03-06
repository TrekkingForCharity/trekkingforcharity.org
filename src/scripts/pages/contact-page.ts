import { inject, injectable } from 'inversify';
import { INFRASTRUCTURE_TYPES, IPage, SERVICE_TYPES } from '../constructs';
import { IValidationHelper } from '../helpers';
import { IRouter, IRouterRequest } from '../infrastructure';
import { IHelperService, IPageContentService } from '../services';
import { BasePage } from './base-page';

@injectable()
export class ContactPage extends BasePage implements IPage {
    public requiresAuthentication: boolean = false;
    protected viewName: string = 'contact.partial';
    protected bodyClasses: string[];
    private validationHelper: IValidationHelper;
    private form: HTMLFormElement;

    constructor(
        @inject(SERVICE_TYPES.PageContentService) pageContentService: IPageContentService,
        @inject(INFRASTRUCTURE_TYPES.Router) router: IRouter,
        @inject(SERVICE_TYPES.HelperService) private helperService: IHelperService,
    ) {
        super(pageContentService, router);
    }

    public canNavigateTo(): Promise<void> {
        return Promise.resolve();
    }

    public canNavigateFrom(): Promise<void> {
        return Promise.resolve();
    }

    protected loadAndProcessPageData(req: IRouterRequest): Promise<void> {
        this.form = this.pageContent.querySelector<HTMLFormElement>('#contact-form');
        return Promise.resolve();
    }

    protected postRender(): Promise<void> {
        const self = this;
        this.validationHelper = this.helperService.generateValidationHelper(this.form, {
            email: {
                email: true,
                presence: true,
            },
            message: {
                presence: true,
            },
            name: {
                presence: true,
            },
        });
        this.form.addEventListener('submit', (event: Event) => { self.formSubmit(event); });

        return Promise.resolve();
    }

    private formSubmit(event: Event): Promise<void> {
        const submitButton = this.form.querySelector('button[type=submit]');
        submitButton.setAttribute('disabled', 'disabled');
        event.preventDefault();
        return this.validationHelper.validate().then(() => {
            // Submit form with API client
            submitButton.removeAttribute('disabled');
            return Promise.resolve();
        }).catch((err: any) => {
            submitButton.removeAttribute('disabled');
            return Promise.resolve();
        });
    }
}
