import React, { useState, useRef } from "react";
import {
  Button,
  useToast,
  Box,
  Text,
  Textarea,
  VStack,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import axios from "axios";
import shslogo from "./assets/singhealth-logo.png";
import shsdividerlogo from "./assets/shs-divider.png";
import { css } from "@emotion/react";

const App: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>(""); // State for the summary
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const tempAudio = useRef<Blob | null>(null);
  const toast = useToast();
  const [apiResponseReceived, setApiResponseReceived] =
    useState<boolean>(false);

  const toggleRecording = async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();
      setRecording(true);

      // Display toast message for starting recording
      toast({
        title: "Recording has started",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
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
        const transcribeResponse = await axios.post(
          "http://20.212.38.210:8000/transcribe",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const transcript = transcribeResponse.data.transcript;
        const [summarizeResponse, formatResponse] = await Promise.all([
          axios.post(
            "https://sgs-genai-omr-api.azurewebsites.net/summarize_transript",
            { transcript },
            { headers: { "Content-Type": "application/json" } }
          ),
          axios.post(
            "https://sgs-genai-omr-api.azurewebsites.net/format_transcript",
            { transcript },
            { headers: { "Content-Type": "application/json" } }
          ),
        ]);

        setTranscript(formatResponse.data.content); // Update as per actual response structure
        setSummary(summarizeResponse.data.content); // Update as per actual response structure
      } catch (error) {
        toast({
          title: "Error transcribing audio",
          description:
            "An error occurred while transcribing the audio." + error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
        setApiResponseReceived(true);
      }
    }
  };

  const customTabStyles = css`
    .chakra-tabs__tab {
      color: #e54809; /* Change to your preferred shade of orange */
    }
  `;

  return (
    <VStack spacing={4} p={4}>
      <Box textAlign="center">
        <img src={shslogo} alt="SingHealth Logo" width={225} height={125} />
        <Text fontSize="4xl" fontWeight="bold" color="#E54809" align="center">
          SingScribe
        </Text>
        <Text fontSize="xl" fontWeight="normal" color="black" align="center">
          Voice to Text Transcription and summarization
        </Text>
        <img
          src={shsdividerlogo}
          alt="SingHealth Divider"
          width="1000px"
          height="10px"
        />
      </Box>
      <Button
        colorScheme={recording ? "blue" : "orange"}
        onClick={toggleRecording}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </Button>
      {isLoading ? (
        <Spinner size="xl" color="#E54809" />
      ) : (
        apiResponseReceived && (
          <Tabs css={customTabStyles}>
            <TabList>
              <Tab>Transcript</Tab>
              <Tab>Summary</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Textarea
                  width={1000}
                  height={400}
                  value={transcript}
                  readOnly
                />
              </TabPanel>
              <TabPanel>
                <Textarea
                  width={1000}
                  height={400}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )
      )}
    </VStack>
  );
};

export default App;
