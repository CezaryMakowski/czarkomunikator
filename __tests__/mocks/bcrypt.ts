export const bcryptMock = {
  hash: jest.fn(),
  compare: jest.fn(),
};

jest.mock("bcrypt", () => bcryptMock);
