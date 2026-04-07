import re
with open('src/app/admin/courses/CoursesClient.tsx', 'r') as f:
    content = f.read()
# Replace the mangled line. The regex is broad to catch the mangled parts.
content = re.sub(r'if \(isImg\) return.*?; // eslint-disable-line @next/next/no-img-element', 'if (isImg) return <img key={i} src={url} alt={file.filename} className="max-w-full rounded-xl shadow-sm border border-gray-200 mt-2" />; // eslint-disable-line @next/next/no-img-element', content)
with open('src/app/admin/courses/CoursesClient.tsx', 'w') as f:
    f.write(content)
