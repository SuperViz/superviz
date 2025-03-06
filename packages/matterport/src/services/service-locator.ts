/**
 * ServiceLocator provides a central registry for all services in the application.
 * This helps avoid direct dependencies between components and eliminates circular dependencies.
 */
export class ServiceLocator {
  private static instance: ServiceLocator | null = null;
  private services: Map<string, any> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of ServiceLocator
   */
  public static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  /**
   * Register a service with the locator
   * @param key The key to identify the service
   * @param service The service instance
   */
  public register(key: string, service: any): void {
    this.services.set(key, service);
  }

  /**
   * Get a service from the locator
   * @param key The key of the service to retrieve
   * @returns The service instance
   */
  public get(key: string): any {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service not found: ${key}`);
    }
    return service;
  }

  /**
   * Check if a service exists in the locator
   * @param key The key of the service to check
   * @returns Whether the service exists
   */
  public has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Reset the service locator (mainly for testing)
   */
  public static reset(): void {
    ServiceLocator.instance = null;
  }

  /**
   * Get a service from the locator, creating it if it doesn't exist
   * @param key The key of the service to retrieve
   * @param createFn Optional function to create the service if not found
   * @returns The service instance
   */
  public getOrCreate(key: string, createFn: () => any): any {
    if (!this.has(key) && createFn) {
      const service = createFn();
      this.register(key, service);
      return service;
    }
    return this.get(key);
  }
}
