import SparkMD5 from 'spark-md5';
import { Component } from 'react';
import { CHUNK_SIZE } from './common';

export function getFileMd5(this: Component, fileChunkList: { file: Blob }[]): Promise<string> {
    return new Promise((resolve, reject) => {
        let count = 0;
        let totalCount = fileChunkList.length;
        let spark = new SparkMD5.ArrayBuffer();
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            let percent = Math.round((count / totalCount) * 100);
            this.setState({ scanPercent: percent });
            if (e.target && e.target.result) {
                count++;
                spark.append(e.target.result as ArrayBuffer);
            }
            if (count < totalCount) {
                loadNext();
            } else {
                this.setState({ scanPercent: 100 });
                resolve(spark.end());
            }
        };
        fileReader.onerror = function () {
            reject({ message: 'file read error' });
        };
        function loadNext() {
            fileReader.readAsArrayBuffer(fileChunkList[count].file);
        }
        loadNext();
    });
}

export function createFileChunk(file: File) {
    const fileChunkList = [];
    let part = 0;
    while (part < file.size) {
        fileChunkList.push({ file: file.slice(part, part + CHUNK_SIZE) });
        part += CHUNK_SIZE;
    }
    return fileChunkList;
}
