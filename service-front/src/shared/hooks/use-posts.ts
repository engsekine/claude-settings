import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 投稿の型定義
 */
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

/**
 * 投稿一覧を取得するカスタムフック
 * TanStack Queryを使ったデータフェッチングの例
 */
export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async (): Promise<Post[]> => {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
      );
      if (!response.ok) {
        throw new Error("投稿一覧の取得に失敗しました");
      }
      return response.json();
    },
  });
}

/**
 * 投稿詳細を取得するカスタムフック
 */
export function usePost(postId: number) {
  return useQuery({
    queryKey: ["posts", postId],
    queryFn: async (): Promise<Post> => {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${postId}`,
      );
      if (!response.ok) {
        throw new Error("投稿の取得に失敗しました");
      }
      return response.json();
    },
    enabled: postId > 0, // postIdが0より大きい場合のみ実行
  });
}

/**
 * 投稿を作成するカスタムフック
 * Mutationの例
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPost: Omit<Post, "id">): Promise<Post> => {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newPost),
        },
      );
      if (!response.ok) {
        throw new Error("投稿の作成に失敗しました");
      }
      return response.json();
    },
    // 成功時にキャッシュを無効化
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
