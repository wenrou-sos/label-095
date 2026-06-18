export interface MemberTag {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
  memberCount?: number;
}

export interface TagMemberRelation {
  memberId: string;
  tagIds: string[];
}
