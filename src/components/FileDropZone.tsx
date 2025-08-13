"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Code } from "lucide-react";

interface FileInfo {
  name: string;
  content: string;
  type: string;
  size: number;
}

interface FileDropZoneProps {
  onFilesAdded: (files: FileInfo[]) => void;
  attachedFiles: FileInfo[];
  onFileRemove: (index: number) => void;
}

export default function FileDropZone({
  onFilesAdded,
  attachedFiles,
  onFileRemove,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter((prev) => prev - 1);
      if (dragCounter <= 1) {
        setIsDragging(false);
      }
    },
    [dragCounter]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);

      const files = Array.from(e.dataTransfer.files);
      const textFiles = files.filter(
        (file) =>
          file.type.startsWith("text/") ||
          file.name.match(
            /\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|html|json|xml|md|txt|yml|yaml|toml|rs|go|php)$/i
          )
      );

      if (textFiles.length === 0) {
        alert("텍스트 파일이나 코드 파일만 업로드할 수 있습니다.");
        return;
      }

      try {
        const fileInfos: FileInfo[] = [];

        for (const file of textFiles) {
          const content = await readFileContent(file);
          fileInfos.push({
            name: file.name,
            content,
            type: file.type || "text/plain",
            size: file.size,
          });
        }

        onFilesAdded(fileInfos);
      } catch (error) {
        console.error("파일 읽기 오류:", error);
        alert("파일을 읽는 중 오류가 발생했습니다.");
      }
    },
    [onFilesAdded]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      try {
        const fileInfos: FileInfo[] = [];

        for (const file of files) {
          const content = await readFileContent(file);
          fileInfos.push({
            name: file.name,
            content,
            type: file.type || "text/plain",
            size: file.size,
          });
        }

        onFilesAdded(fileInfos);
      } catch (error) {
        console.error("파일 읽기 오류:", error);
        alert("파일을 읽는 중 오류가 발생했습니다.");
      }
    },
    [onFilesAdded]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const codeExtensions = [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "h",
      "css",
      "html",
      "json",
      "xml",
      "yml",
      "yaml",
      "rs",
      "go",
      "php",
    ];

    if (codeExtensions.includes(ext || "")) {
      return <Code size={16} className="text-blue-600" />;
    }
    return <FileText size={16} className="text-gray-600" />;
  };

  return (
    <div className="space-y-4">
      {/* 드롭 존 */}
      <button
        type="button"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          w-full border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }
        `}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <Upload
          className={`mx-auto mb-4 ${
            isDragging ? "text-blue-500" : "text-gray-400"
          }`}
          size={48}
        />
        <p
          className={`text-lg font-medium mb-2 ${
            isDragging ? "text-blue-600" : "text-gray-600"
          }`}
        >
          {isDragging
            ? "파일을 여기에 놓으세요"
            : "파일을 드래그하거나 클릭해서 업로드"}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          지원 형식: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .h, .css,
          .html, .json, .xml, .md, .txt, .yml, .yaml, .toml, .rs, .go, .php
        </p>

        <input
          type="file"
          multiple
          accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.md,.txt,.yml,.yaml,.toml,.rs,.go,.php,text/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
          <Upload size={16} className="mr-2" />
          파일 선택
        </span>
      </button>{" "}
      {/* 첨부된 파일 목록 */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <FileText size={16} className="mr-2" />
            첨부된 파일 ({attachedFiles.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {attachedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} •{" "}
                      {file.content.split("\n").length} 줄
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onFileRemove(index)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="파일 제거"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
            💡 이 파일들의 내용이 메시지와 함께 Gemini에게 전달됩니다.
          </div>
        </div>
      )}
    </div>
  );
}
