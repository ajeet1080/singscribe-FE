import React, { useEffect, useState } from "react";
import {
  Button,
  useToast,
  Box,
  Text,
  Textarea,
  VStack,
  HStack,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  RadioGroup,
  Stack,
  Radio,
} from "@chakra-ui/react";
import axios from "axios";
import shslogo from "./assets/singhealth-logo.png";
import shsdividerlogo from "./assets/shs-divider.png";
import {
  ConversationTranscriber,
  SpeechConfig,
  AudioConfig,
} from "microsoft-cognitiveservices-speech-sdk";
useColorModeValue;

const App: React.FC = () => {
  const [recording, setRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>(""); // State for the summary text
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();
  const [apiResponseReceived, setApiResponseReceived] =
    useState<boolean>(false);
  const [isLoadingTranscript, setIsLoadingTranscript] =
    useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [formattedTranscript, setFormattedTranscript] = useState("");
  const [transcription, setTranscription] = useState<
    { speakerId: string; text: string }[]
  >([]);
  const [conversationTranscriber, setConversationTranscriber] =
    useState<ConversationTranscriber | null>(null);
  const [languageSelected, setLanguageSelected] = useState(false);
  const [language, setLanguage] = useState("en-SG");
  const [isOpen, setIsOpen] = useState(true);
  const onClose = () => setIsOpen(false);

  const toggleRecording = async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  useEffect(() => {
    if (languageSelected) {
      onClose();
    }
  }, [language]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    setLanguageSelected(true);
  };

  const startRecording = async () => {
    try {
      const speechConfig = SpeechConfig.fromSubscription(
        "e5404bd89ea14c388c2c17234f95e36a",
        "southeastasia"
      );
      speechConfig.speechRecognitionLanguage = language;
      const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
      const transcriber = new ConversationTranscriber(
        speechConfig,
        audioConfig
      );

      transcriber.transcribed = (
        s: any,
        e: { result: { text: string; speakerId: string } }
      ) => {
        setTranscription((prevTranscription) => [
          ...prevTranscription,
          { speakerId: e.result.speakerId, text: e.result.text },
        ]);
      };

      await transcriber.startTranscribingAsync();
      setConversationTranscriber(transcriber);
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
    if (conversationTranscriber) {
      await conversationTranscriber.stopTranscribingAsync();
      setConversationTranscriber(null);
    }
    setRecording(false);
    setIsLoading(true);
    setIsLoadingSummary(true);
    setIsLoadingTranscript(true);
    await transcribeAudio();
  };

  const transcribeAudio = async () => {
    const transcript = transcription
      .map((t) => `${t.speakerId}: ${t.text}`)
      .join("\n");
    // setIsLoading(true);
    axios
      .post(
        "https://sgs-genai-omr-api.azurewebsites.net/format_transcript",
        { transcript },
        { headers: { "Content-Type": "application/json" } }
      )
      .then((formatResponse) => {
        setTranscript(formatResponse.data.content); // Update as per actual response structure
        setFormattedTranscript(formatResponse.data.content);
        setIsLoadingTranscript(false);
        //  setIsLoading(true);
      });

    axios
      .post(
        "https://sgs-genai-omr-api.azurewebsites.net/summarize_transript",
        { transcript },
        { headers: { "Content-Type": "application/json" } }
      )
      .then((summarizeResponse) => {
        setSummary(summarizeResponse.data.content); // Update as per actual response structure
        setIsLoadingSummary(false);
        // setIsLoading(true);
      });
    setApiResponseReceived(true);
  };

  return (
    <VStack spacing={4} p={4}>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select a language</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <RadioGroup onChange={handleLanguageChange} value={language}>
              <Stack direction="column">
                <Radio value="en-SG">English</Radio>
                <Radio value="zh-SG">Mandarin</Radio>
                <Radio value="id-ID">Bahasa</Radio>
                <Radio value="ta-IN">Tamil</Radio>
              </Stack>
            </RadioGroup>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
      {
        <HStack spacing={4} width="100%">
          <Tabs flex="1" width="100%" height={500} p={3} borderRadius="md">
            <Text fontSize="2xl" fontWeight="bold">
              Transcript
            </Text>
            <TabList>
              <Tab _selected={{ color: "#E54809", borderColor: "#E54809" }}>
                Raw Transcript
              </Tab>
              <Tab _selected={{ color: "#E54809", borderColor: "#E54809" }}>
                Formatted Transcript
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel width="100%" height={450} p={3} borderRadius="md">
                {transcription.map((t, index) => (
                  <p
                    key={index}
                    style={{
                      color: t.speakerId === "Guest-1" ? "blue" : "red",
                    }}
                  >
                    {t.speakerId} : {t.text}
                  </p>
                ))}
              </TabPanel>
              <TabPanel width="100%" height={450} p={3} borderRadius="md">
                {isLoadingTranscript ? (
                  <Spinner
                    label="Formating transcript, please wait..."
                    size="xl"
                    color="#E54809"
                  />
                ) : (
                  formattedTranscript.split("\n").map((line, index) => {
                    const [speaker, text] = line.split(": ");
                    return (
                      <p
                        key={index}
                        style={{
                          color: speaker === "Doctor" ? "blue" : "red",
                        }}
                      >
                        {speaker} : {text}
                      </p>
                    );
                  })
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Box flex="1" width="100%" height={500} p={3} borderRadius="md">
            <Text fontSize="2xl" fontWeight="bold">
              Summary
            </Text>
            {isLoadingSummary ? (
              <Spinner size="xl" color="#E54809" />
            ) : (
              <Textarea
                width="100%"
                height={450}
                p={3}
                borderRadius="md"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            )}
          </Box>
        </HStack>
      }
    </VStack>
  );
};

export default App;
