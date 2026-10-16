type QueryParams = Record<string, string | string[]>;

export class QueryParamsBuilder {
  private params: QueryParams;

  constructor() {
    this.params = {};
  }

  addParam(key: string, value: string | string[]): this {
    if (value) {
      if (typeof value === "string" && value.trim()) {
        this.params[key] = value;
      } else if (
        Array.isArray(value) &&
        value.some((v) => v?.toString().trim())
      ) {
        this.params[key] = value.filter(
          (v) => typeof v === "string" && v.trim()
        );
      }
    }
    return this;
  }

  addParams(params: QueryParams): this {
    Object.entries(params).forEach(([key, value]) => this.addParam(key, value));
    return this;
  }

  addFilter(field: string, values: string[]): this {
    if (values?.length) {
      if (!Array.isArray(this.params["filter"])) {
        this.params["filter"] = [];
      }
      values.forEach((value) => {
        if (typeof value === "string" && value.trim()) {
          (this.params["filter"] as string[]).push(`${field}:${value}`);
        }
      });
    }
    return this;
  }

  addSearch(searchTerm: string): this {
    if (searchTerm?.trim()) {
      this.params["search"] = searchTerm.trim();
    }
    return this;
  }

  addPagination(page: number, limit: number): this {
    if (page && limit) {
      this.params["page"] = page.toString();
      this.params["limit"] = limit.toString();
    }
    return this;
  }

  build(): string {
    const queryParts: string[] = [];

    if (
      Array.isArray(this.params["filter"]) &&
      this.params["filter"].length
    ) {
      queryParts.push(
        `filter=${encodeURIComponent(this.params["filter"].join(","))}`
      );
    }

    Object.entries(this.params).forEach(([key, value]) => {
      if (key !== "filter" && value) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParts.push(`${key}=${encodeURIComponent(v)}`));
        } else {
          queryParts.push(`${key}=${encodeURIComponent(value as string)}`);
        }
      }
    });

    return queryParts.length ? `?${queryParts.join("&")}` : "";
  }
}
