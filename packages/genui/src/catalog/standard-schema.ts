/*
 * The Standard Schema and Standard JSON Schema interfaces (https://standardschema.dev, spec
 * version 1), copied rather than imported as the spec recommends, and written as types. zod 4.2+,
 * ArkType 2.1.28+, and Effect 4 schemas implement both on one `~standard` object; Valibot gets the
 * JSON Schema half from `toStandardJsonSchema()` in `@valibot/to-json-schema`.
 */

/** The inferred types a schema may carry. */
export type StandardTypes<TInput = unknown, TOutput = TInput> = {
  readonly input: TInput;
  readonly output: TOutput;
};

/** A path segment of an issue: a bare key or `{ key }`. */
export type StandardPathSegment = PropertyKey | { readonly key: PropertyKey };

/** One validation problem. */
export type StandardIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<StandardPathSegment> | undefined;
};

/** The result of `~standard.validate`: a value, or issues. */
export type StandardResult<TOutput> =
  | { readonly value: TOutput; readonly issues?: undefined }
  | { readonly issues: ReadonlyArray<StandardIssue> };

/** The target of a generated JSON Schema. */
export type StandardJSONSchemaTarget = "draft-2020-12" | "draft-07" | "openapi-3.0" | ({} & string);

export type StandardJSONSchemaOptions = {
  readonly target: StandardJSONSchemaTarget;
  readonly libraryOptions?: Record<string, unknown> | undefined;
};

/** A schema that validates values (`StandardSchemaV1`). */
export type StandardSchemaV1<TInput = unknown, TOutput = TInput> = {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly types?: StandardTypes<TInput, TOutput> | undefined;
    readonly validate: (
      value: unknown,
      options?: { readonly libraryOptions?: Record<string, unknown> | undefined } | undefined,
    ) => StandardResult<TOutput> | Promise<StandardResult<TOutput>>;
  };
};

/** A schema that converts itself to JSON Schema (`StandardJSONSchemaV1`). */
export type StandardJSONSchemaV1<TInput = unknown, TOutput = TInput> = {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly types?: StandardTypes<TInput, TOutput> | undefined;
    readonly jsonSchema: {
      readonly input: (options: StandardJSONSchemaOptions) => Record<string, unknown>;
      readonly output: (options: StandardJSONSchemaOptions) => Record<string, unknown>;
    };
  };
};

/** The input type a schema declares. */
export type InferInput<TSchema extends { readonly "~standard": { readonly types?: unknown } }> =
  NonNullable<TSchema["~standard"]["types"]> extends StandardTypes<infer TInput, unknown>
    ? TInput
    : unknown;
