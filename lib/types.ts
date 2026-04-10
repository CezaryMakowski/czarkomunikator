export interface OnlineUser {
  userId: string;
  online_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  active?: boolean;
  lastSeenAt?: Date;
}
