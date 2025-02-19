export type AnnotationParams = {
  roomId: string;
  position: string;
  userId: string;
};

export type CommentParams = {
  annotationId: string;
  userId: string;
  text: string;
};

export type FetchAnnotationsParams = {
  roomId: string;
}

export type MentionParams = {
  commentsId: string
  participants: MentionParticipantParams[]
}

export type MentionParticipantParams = {
  id: string
  readed: number
}

export type CreateParticipantParams = {
  name?: string;
  participantId: string;
  avatar?: string | null;
  email?: string
};
