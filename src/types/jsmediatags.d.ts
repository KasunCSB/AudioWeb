declare module 'jsmediatags' {
  interface Tag {
    type: string;
    tags: {
      title?: string;
      artist?: string;
      album?: string;
      year?: string;
      comment?: { data: string; };
      track?: string;
      genre?: string;
      picture?: {
        format: string;
        type: string;
        description: string;
        data: Uint8Array;
      };
      lyrics?: {
        language: string;
        descriptor: string;
        lyrics: string;
      };
      USLT?: {
        language: string;
        descriptor: string;
        lyrics: string;
      };
      [key: string]: unknown;
    };
  }

  interface Callbacks {
    onSuccess: (tag: Tag) => void;
    onError: (error: { type: string; info: string }) => void;
  }

  const jsmediatags: {
    read: (file: File | string, callbacks: Callbacks) => void;
  };

  export default jsmediatags;
}
