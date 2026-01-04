/**
 * Type declarations for @google/earthengine
 * This package doesn't have TypeScript definitions
 */
declare module '@google/earthengine' {
  interface EE {
    initialize(
      opt_baseurl?: string | null,
      opt_tileurl?: string | null,
      successCallback?: () => void,
      errorCallback?: (error: Error) => void
    ): void;
    data: {
      authenticateViaPrivateKey(
        serviceAccountCredentials: {
          client_email: string;
          private_key: string;
        },
        successCallback?: () => void,
        errorCallback?: (error: Error) => void
      ): void;
    };
    ImageCollection: (id: string) => ImageCollection;
    Image: (id?: string | number | object) => Image;
    Geometry: {
      Polygon: (coordinates: number[][][]) => Geometry;
      Point: (coordinates: number[]) => Geometry;
      Rectangle: (coordinates: number[]) => Geometry;
    };
    Date: {
      fromYMD: (year: number, month: number, day: number) => EEDate;
    };
    Reducer: {
      mean: () => Reducer;
      first: () => Reducer;
      min: () => Reducer;
      max: () => Reducer;
      stdDev: () => Reducer;
    };
    Feature: (geometry: Geometry | null, properties?: object) => Feature;
    FeatureCollection: (features: Feature[] | FeatureCollection) => FeatureCollection;
    List: (array: unknown[]) => EEList;
    Number: (value: number) => EENumber;
    String: (value: string) => EEString;
    Algorithms: {
      If: (condition: unknown, trueCase: unknown, falseCase: unknown) => unknown;
    };
    Filter: {
      eq: (field: string, value: unknown) => Filter;
      and: (...filters: Filter[]) => Filter;
      or: (...filters: Filter[]) => Filter;
      listContains: (leftField: string, rightValue: unknown) => Filter;
      lt: (field: string, value: unknown) => Filter;
      gt: (field: string, value: unknown) => Filter;
      lte: (field: string, value: unknown) => Filter;
      gte: (field: string, value: unknown) => Filter;
    };
  }

  interface Geometry {
    bounds: () => Geometry;
    centroid: () => Geometry;
    area: () => EENumber;
    coordinates: () => EEList;
    type: () => EEString;
  }

  interface ImageCollection {
    filterBounds: (geometry: Geometry) => ImageCollection;
    filterDate: (start: string | EEDate, end: string | EEDate) => ImageCollection;
    filter: (filter: Filter) => ImageCollection;
    select: (bands: string | string[]) => ImageCollection;
    sort: (property: string, ascending?: boolean) => ImageCollection;
    first: () => Image;
    size: () => EENumber;
    map: (fn: (image: Image) => Image | Feature) => ImageCollection | FeatureCollection;
    mean: () => Image;
    median: () => Image;
    min: () => Image;
    max: () => Image;
    mosaic: () => Image;
    limit: (max: number, property?: string, ascending?: boolean) => ImageCollection;
    toList: (count: number, offset?: number) => EEList;
    aggregate_array: (property: string) => EEList;
  }

  interface Image {
    select: (bands: string | string[], newNames?: string[]) => Image;
    reduceRegion: (options: {
      reducer: Reducer;
      geometry: Geometry;
      scale: number;
      maxPixels?: number;
      bestEffort?: boolean;
    }) => EEDictionary;
    get: (property: string) => EEString | EENumber;
    date: () => EEDate;
    clip: (geometry: Geometry) => Image;
    set: (properties: object) => Image;
    rename: (names: string | string[]) => Image;
    multiply: (value: number | Image) => Image;
    divide: (value: number | Image) => Image;
    add: (value: number | Image) => Image;
    subtract: (value: number | Image) => Image;
    addBands: (image: Image, names?: string[], overwrite?: boolean) => Image;
    bandNames: () => EEList;
    expression: (expression: string, map?: object) => Image;
  }

  interface Feature {
    get: (property: string) => unknown;
    getInfo: (callback?: (result: object | null, error?: Error) => void) => object | null;
    set: (key: string | object, value?: unknown) => Feature;
    geometry: () => Geometry;
  }

  interface FeatureCollection {
    getInfo: (callback?: (result: { features: object[] } | null, error?: Error) => void) => { features: object[] } | null;
    size: () => EENumber;
    aggregate_array: (property: string) => EEList;
    first: () => Feature;
    filter: (filter: Filter) => FeatureCollection;
    map: (fn: (feature: Feature) => Feature) => FeatureCollection;
    toList: (count: number, offset?: number) => EEList;
  }

  interface EEDictionary {
    get: (key: string) => EENumber | EEString;
    getInfo: (callback?: (result: Record<string, unknown> | null, error?: Error) => void) => Record<string, unknown> | null;
    evaluate: (callback: (result: Record<string, unknown> | null, error?: Error) => void) => void;
    keys: () => EEList;
    values: () => EEList;
  }

  interface EEList {
    get: (index: number) => unknown;
    getInfo: (callback?: (result: unknown[] | null, error?: Error) => void) => unknown[] | null;
    size: () => EENumber;
    map: (fn: (item: unknown) => unknown) => EEList;
    flatten: () => EEList;
    slice: (start: number, end?: number) => EEList;
  }

  interface EENumber {
    getInfo: (callback?: (result: number | null, error?: Error | null) => void) => number | null;
    evaluate: (callback: (result: number | null, error?: Error | null) => void) => void;
    format: (pattern?: string) => EEString;
    multiply: (value: number | EENumber) => EENumber;
    divide: (value: number | EENumber) => EENumber;
    add: (value: number | EENumber) => EENumber;
    subtract: (value: number | EENumber) => EENumber;
    gt: (value: number | EENumber) => EENumber;
    lt: (value: number | EENumber) => EENumber;
    gte: (value: number | EENumber) => EENumber;
    lte: (value: number | EENumber) => EENumber;
  }

  interface EEString {
    getInfo: (callback?: (result: string | null, error?: Error) => void) => string | null;
    evaluate: (callback: (result: string | null, error?: Error) => void) => void;
    cat: (value: string | EEString) => EEString;
  }

  interface EEDate {
    format: (pattern?: string) => EEString;
    getInfo: (callback?: (result: { value: number } | null, error?: Error) => void) => { value: number } | null;
    millis: () => EENumber;
    advance: (delta: number, unit: string) => EEDate;
  }

  interface Reducer {
    combine: (options: { reducer2: Reducer; sharedInputs: boolean }) => Reducer;
    setOutputs: (names: string[]) => Reducer;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Filter {
    // Filter is composable - intentionally empty as it's a marker type
  }

  const ee: EE;
  export = ee;
}
