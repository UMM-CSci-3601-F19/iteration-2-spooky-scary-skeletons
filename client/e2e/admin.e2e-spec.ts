import {AppPage} from './app.po';
// more to add later... no admin page yet ;)
describe('angular-spark-lab', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should load', () => {
    page.navigateTo();
  });
});
