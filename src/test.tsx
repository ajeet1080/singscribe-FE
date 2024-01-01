import React, { useState, useRef } from "react";
import {
  Button,
  useToast,
  Box,
  Text,
  Textarea,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import axios from "axios";

const App: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const tempAudio = useRef<Blob | null>(null);
  const toast = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      toast({
        title: "Error starting recording",
        description:
          "Failed to start recording. Please ensure your microphone is working.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        tempAudio.current = audioBlob;
        audioChunksRef.current = [];
        setRecording(false);
        await transcribeAudio();
      };
    }
  };

  const transcribeAudio = async () => {
    if (tempAudio.current) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("audio", tempAudio.current);

      try {
        const response = await axios.post(
          "http://20.212.38.210:8000/transcribe",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setTranscript(response.data.transcript);
      } catch (error) {
        toast({
          title: "Error transcribing audio",
          description: "An error occurred while transcribing the audio.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <VStack spacing={4} p={4}>
      <Button colorScheme="blue" onClick={startRecording} disabled={recording}>
        Start Recording
      </Button>
      <Button colorScheme="red" onClick={stopRecording} disabled={!recording}>
        Stop Recording
      </Button>
      {isLoading ? (
        <Spinner size="xl" />
      ) : (
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Transcript:
          </Text>
          <Textarea width={1000} value={transcript} readOnly />
        </Box>
      )}
    </VStack>
  );
};

export default App;
