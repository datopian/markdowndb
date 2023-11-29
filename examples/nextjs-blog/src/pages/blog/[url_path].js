import ReactMarkdown from 'react-markdown';
import { formatDate } from '../../utils/dateFormatter';
import fs from 'fs';
import path from 'path';

const BlogPost = ({ post }) => {
    const removeMetadata = (content) => {
        // Assuming metadata is between '---' at the beginning of the content
        const metadataRegex = /^---[\s\S]*?---/;
        return content.replace(metadataRegex, '');
    };

    return (
        <div>
            <h1>{post.metadata.title}</h1>
            <p>{formatDate(post.metadata.date)}</p>
            <ul>
                <li>
                    <strong>Tags:</strong> {post.tags.join(', ')}
                </li>
            </ul>
            <div>
                <ReactMarkdown>{removeMetadata(post.content)}</ReactMarkdown>
            </div>
        </div>
    );
};

export async function getStaticPaths() {
    const filePath = path.join(process.cwd(), 'src/.markdowndb/files.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const posts = JSON.parse(fileContent);

    // Generate paths for all posts
    const paths = posts.map((post) => ({
        params: { url_path: post.url_path },
    }));

    return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
    const filePath = path.join(process.cwd(), 'src/.markdowndb/files.json');
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    const posts = JSON.parse(jsonContent);
    const post = posts.find((post) => post.url_path === params.url_path);

    const contentPath = path.join(process.cwd(), `src/content/${params.url_path}.md`);
    const content = fs.readFileSync(contentPath, 'utf-8');
    post.content = content;

    return {
        props: {
            post,
        },
    };
}

export default BlogPost;
