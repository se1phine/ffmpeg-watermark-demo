import { Button, Space, Upload } from "antd"
import { RcFile } from "antd/es/upload/interface";

interface VideoUploadProps {
  disabled: boolean;
  onChange: (file: RcFile) => void;
  onRemove: () => void;
}

function VideoUpload(props: VideoUploadProps) {
  const { disabled, onChange, onRemove } = props;
  return (
    <>
      <Space>
        {disabled ? (
          <Button
            danger={true}
            disabled={!disabled}
            onClick={onRemove}
          >
            Remove
          </Button>
        ) : (
          <Upload
            beforeUpload={() => {
              return false
            }}
            accept="video/*"
            onChange={(info) => {
              if (info.fileList && info.fileList.length > 0) {
                onChange(info.fileList[0].originFileObj!)
              }
            }}
            showUploadList={false}
          >
            <Button type="primary">Select Video</Button>
          </Upload>
        )}

      </Space>

    </>
  )
}

export default VideoUpload