import { Container, inject, injectable } from 'inversify';
import { ProuterRequest, ProuterResponse } from 'prouter';
import { INavigationRejection, IPage, NavigationRejectionReason } from '../constructs';
import { IRouterRequest } from '../infrastucture';
import { IAuthenticationService } from './';

export interface IPageProcessingService {
    loadPage(pageName: string, req: ProuterRequest, resp: ProuterResponse): Promise<IPage>;
}

interface IPageData {
    page?: IPage;
    navigationRejection?: INavigationRejection;
}

@injectable()
export class PageProcessingService implements IPageProcessingService {
    private currentPage: IPage;

    constructor(
        @inject('container') private container: Container,
        @inject('authentication-service') private authenticationService: IAuthenticationService) {
    }

    public async loadPage(pageName: string, req: IRouterRequest, resp: ProuterResponse): Promise<IPage> {
        const self = this;
        return self.performSafeNavigateFromCheck()
            .then((pageData: IPageData) => self.discoverPage(pageData, pageName))
            .then((pageData: IPageData) => self.performAuthenticationCheck(pageData))
            .then((pageData: IPageData) => self.performSafeNavigateToCheck(pageData))
            .then((pageData: IPageData) => {
                if (pageData.navigationRejection) {
                    if (!pageData.page) {
                        (resp as any).end({ preventNavigation: pageData.navigationRejection !== undefined });
                        return Promise.reject(pageData.navigationRejection);
                    }
                    req.navigationRejection = pageData.navigationRejection;
                }
                return pageData.page.init(req).then(() => {
                    self.currentPage = pageData.page;
                    (resp as any).end({ preventNavigation: pageData.navigationRejection !== undefined });
                    return Promise.resolve(pageData.page);
                });
            });
    }

    private async performSafeNavigateFromCheck(): Promise<IPageData> {
        if (!this.currentPage) {
            return Promise.resolve({});
        }

        return this.currentPage.canNavigateFrom().then(() => {
            return Promise.resolve({});
        }).catch(() => {
            const pageData: IPageData = {
                navigationRejection: {
                    navigationRejectionReason: NavigationRejectionReason.locked,
                },
            };
            return Promise.resolve(pageData);
        });
    }

    private discoverPage(pageData: IPageData, pageName: string): Promise<IPageData> {
        if (pageData.navigationRejection) {
            return Promise.resolve(pageData);
        }
        const page = this.container.get(pageName) as IPage;
        if (!page) {
            // GET ERROR PAGE
            return this.processError({
                navigationRejectionReason: NavigationRejectionReason.notFound,
            });
        }
        return Promise.resolve({page});
    }
    private performAuthenticationCheck(pageData: IPageData): Promise<IPageData> {
        if (pageData.navigationRejection) {
            return Promise.resolve(pageData);
        }
        if (pageData.page.requiresAuthentication && !this.authenticationService.isAuthenticated) {
            return this.processError({
                navigationRejectionReason: NavigationRejectionReason.notAuthenticated,
            });
        }

        return Promise.resolve(pageData);
    }

    private performSafeNavigateToCheck(pageData: IPageData): Promise<IPageData> {
        if (pageData.navigationRejection) {
            return Promise.resolve(pageData);
        }
        return pageData.page.canNavigateTo()
            .then(() => Promise.resolve(pageData))
            .catch(() => {
                return this.processError({
                    navigationRejectionReason: NavigationRejectionReason.notSafe,
                });
        });
    }

    private processError(navigationRejection: INavigationRejection): Promise<IPageData> {
        const page = this.container.get('error-page') as IPage;
        if (!page) {
            return Promise.reject();
        }

        return Promise.resolve({
            navigationRejection,
            page,
        });
    }
}
