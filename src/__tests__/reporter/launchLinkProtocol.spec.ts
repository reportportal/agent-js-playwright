import { RPReporter } from '../../reporter';
import { RPClientMock } from '../mocks/RPClientMock';
import type { ReportPortalConfig } from '../../models';

describe('launch link protocol correction', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('when endpoint is https and server returns http link', () => {
    it('should fix the link protocol to https', async () => {
      const config: ReportPortalConfig = {
        apiKey: '00000000-0000-0000-0000-000000000000',
        endpoint: 'https://reportportal.server/api/v1',
        project: 'ProjectName',
        launch: 'LaunchName',
      };

      const reporter = new RPReporter(config);
      const mockClient = new RPClientMock(config) as unknown as typeof reporter.client;
      reporter.client = mockClient;
      reporter.launchId = 'tempLaunchId';

      const responseObject = {
        link: 'http://reportportal.server/ui/#/project/launch/uuid',
      };

      (mockClient.finishLaunch as jest.Mock).mockReturnValue({
        promise: Promise.resolve(responseObject),
      });

      await reporter.onEnd();

      expect(responseObject.link).toBe('https://reportportal.server/ui/#/project/launch/uuid');
      // Verify the link was fixed internally without duplicate logging
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('ReportPortal Launch Link:'),
      );
    });
  });

  describe('when endpoint is http and server returns http link', () => {
    it('should keep the http protocol', async () => {
      const config: ReportPortalConfig = {
        apiKey: '00000000-0000-0000-0000-000000000000',
        endpoint: 'http://reportportal.server/api/v1',
        project: 'ProjectName',
        launch: 'LaunchName',
      };

      const reporter = new RPReporter(config);
      const mockClient = new RPClientMock(config) as unknown as typeof reporter.client;
      reporter.client = mockClient;
      reporter.launchId = 'tempLaunchId';

      const responseObject = {
        link: 'http://reportportal.server/ui/#/project/launch/uuid',
      };

      (mockClient.finishLaunch as jest.Mock).mockReturnValue({
        promise: Promise.resolve(responseObject),
      });

      await reporter.onEnd();

      expect(responseObject.link).toBe('http://reportportal.server/ui/#/project/launch/uuid');
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('ReportPortal Launch Link:'),
      );
    });
  });

  describe('when link is not a valid URL', () => {
    it('should return the link as-is', async () => {
      const config: ReportPortalConfig = {
        apiKey: '00000000-0000-0000-0000-000000000000',
        endpoint: 'https://reportportal.server/api/v1',
        project: 'ProjectName',
        launch: 'LaunchName',
      };

      const reporter = new RPReporter(config);
      const mockClient = new RPClientMock(config) as unknown as typeof reporter.client;
      reporter.client = mockClient;
      reporter.launchId = 'tempLaunchId';

      const responseObject = {
        link: 'invalid-url',
      };

      (mockClient.finishLaunch as jest.Mock).mockReturnValue({
        promise: Promise.resolve(responseObject),
      });

      await reporter.onEnd();

      expect(responseObject.link).toBe('invalid-url');
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('ReportPortal Launch Link:'),
      );
    });
  });
});
