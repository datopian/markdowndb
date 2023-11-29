import Link from 'next/link';
import { formatDate } from '../utils/dateFormatter';

const BlogPostsList = ({ posts }) => {
    if (!posts || !Array.isArray(posts)) {
        return (
            <div>
                <h2>No Blog Posts Available</h2>
            </div>
        );
    }

    return (
        <div>
            <h2>Blog Posts</h2>
            <ul>
                {posts.map((post) => (
                    <li key={post.id}>
                        <Link href={`/blog/${post.url_path}`}>
                            <h3>{post.metadata.title}</h3>
                        </Link>
                        <p>{formatDate(post.metadata.date)}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};


export default BlogPostsList;
