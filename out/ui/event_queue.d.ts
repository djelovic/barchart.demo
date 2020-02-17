declare type PostCallback = () => void;
export interface PostListener {
    postCallback(): void;
}
export declare function post(postHandler: PostCallback | PostListener): number;
export declare function cancelPost(id: number): void;
export {};
