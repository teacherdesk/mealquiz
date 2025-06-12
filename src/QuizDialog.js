import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  DialogTitle
} from '@mui/material';
import extractInitials from './extractInitials';

const QuizDialog = ({ open, onClose, meals }) => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [fontSize, setFontSize] = useState('10rem');
  const [userAnswer, setUserAnswer] = useState('');
  const [previousAnswers, setPreviousAnswers] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const quizTextRef = useRef(null);

  useEffect(() => {
    const adjustFontSize = () => {
      if (quizTextRef.current) {
        let parentWidth = quizTextRef.current.parentElement.offsetWidth;
        let textWidth = quizTextRef.current.scrollWidth;

        if (textWidth > parentWidth) {
          let newSize = parseFloat(fontSize);
          while (textWidth > parentWidth && newSize > 1) {
            newSize -= 1;
            quizTextRef.current.style.fontSize = `${newSize}rem`;
            textWidth = quizTextRef.current.scrollWidth;
          }
          setFontSize(`${newSize}rem`);
        }
      }
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);

    return () => {
      window.removeEventListener('resize', adjustFontSize);
    };
  }, [fontSize, currentQuizIndex]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextQuiz = () => {
    setShowAnswer(false);
    setCurrentQuizIndex((prevIndex) => (prevIndex + 1) % meals.length);
    setUserAnswer('');
    setPreviousAnswers([]);
    setCorrectAnswer(false);
    setClipboardText('');
  };

  const handleInputChange = (event) => {
    setUserAnswer(event.target.value);
  };

  const handleInputSubmit = (event) => {
    if (event.key === 'Enter' && userAnswer.trim() !== '') {
      const trimmedAnswer = userAnswer.trim();
      setPreviousAnswers([...previousAnswers, trimmedAnswer]);
      setUserAnswer('');
      if (trimmedAnswer === meals[currentQuizIndex]) {
        setCorrectAnswer(true);
        setShowAnswer(true);
        const newAnswers = [...previousAnswers, trimmedAnswer];
        setPreviousAnswers(newAnswers);
        setClipboardText(generateTextFromHighlight(newAnswers, meals[currentQuizIndex]));
      }
    }
  };

  const highlightCorrectLetters = (input, correct) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {input.split('').map((char, index) => {
          let displayChar;
  
          if (correct[index] === ' ') {
            if(char === ' '){
              displayChar = ' ';
            }else if(!isSpecialCharacter(char)){
              displayChar = '□'
            } else{
              displayChar = char;
            }
      
          } else if (isSpecialCharacter(correct[index])) {
            // 기호는 맞든 틀리든 사용자가 입력한 기호를 그대로 표시
            if(char ==' '){
              displayChar = '□'
            }else{
              displayChar = char;
            }
          } else {
            // 공백과 기호가 아닌 경우 알파벳, 숫자, 한글 비교
            displayChar = char === correct[index] ? '■' : '□';
          }
  
          return (
            <div
              key={index}
              style={{
                display: 'inline-block',
                textAlign: 'center',
                margin: '0 5px',
                fontSize: '2rem',
                lineHeight: '2.2rem',
              }}
            >
              <div>{displayChar}</div>
              <div>{char}</div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // 기호를 식별하는 함수 (공백은 예외로 둠)
  const isSpecialCharacter = (char) => !/[a-zA-Z0-9가-힣\s]/.test(char);

  // highlightCorrectLetters 함수에서 텍스트를 생성하는 함수 추가
const generateTextFromHighlight = (answer, correct) => {
  // answer가 문자열이 아닌 경우를 처리
  if (typeof answer === 'string') {
    answer = [answer]; // answer를 배열로 변환
  }
  return answer.map((answer, index) => {
    const emojiLine = answer.split('').map((char, index) => {
      if (correct[index] === ' ') {
        if(char === ' '){
          return ' ';
        }else if(!isSpecialCharacter(char)){
          return '□'
        } else{
          return char;
        }
      } else if (isSpecialCharacter(char)) {
        return char; // 기호는 입력된 그대로 표시
      } else if (!isSpecialCharacter(char) && isSpecialCharacter(correct[index])) {
        return char === correct[index] ? '■' : '□'; // 올바르게 입력했으면 '■', 틀렸으면 '□'
      } 
      else {
        return char === correct[index] ? '■' : '□'; // 올바르게 입력했으면 '■', 틀렸으면 '□'
      }
    }).join(' ');
    const charLine = answer.split('').join(' ');
    return `\n${emojiLine}\n${charLine}`;
  }).join('');
};

  const handleSave = async () => {
    const problem = extractInitials(meals[currentQuizIndex]).split('').join(' ');
    const textToCopy = `${problem}\n${clipboardText}\n\nhttps://mealquiz.tdesk24.com/\n밀퀴즈`;
  
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  const isSpecialLine = (line) => {
    // 특수문자 줄을 확인하는 함수
    return line.split('').every(char => ['■', '□'].includes(char));
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" onClick={onClose}>
            닫기
          </Button>
          <Typography variant="h6" style={{ flex: 1, textAlign: 'center' }}>
            School Meals Quiz
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent style={{ overflow: 'hidden' }}>
        <Box display="flex" height="100vh">
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flex={8}>
            <Typography
              variant="h1"
              component="div"
              align="center"
              gutterBottom
              style={{ fontSize, fontWeight: 'bold' }}
              ref={quizTextRef}
            >
              {extractInitials(meals[currentQuizIndex])}
            </Typography>
            {showAnswer && (
              <Typography
                variant="h3"
                color="textSecondary"
                align="center"
                style={{ fontSize: '5rem', fontWeight: 'bold' }}
              >
                정답: {meals[currentQuizIndex]}
              </Typography>
            )}
            <TextField
              variant="outlined"
              size="small"
              value={userAnswer}
              onChange={handleInputChange}
              onKeyPress={handleInputSubmit}
              placeholder="정답 입력"
              style={{ marginTop: '20px' }}
              autoComplete="off"
            />
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-start" marginRight="20px" style={{ overflowX: 'auto', maxHeight: '80vh' , fontSize: '20px'}} flex={2} >
            {previousAnswers.map((answer, index) => (
              <Box key={index} display="flex" alignItems="center" marginTop="10px">
                <Typography variant="h5" component="div" style={{ marginRight: '10px' }}>
                  {index + 1}.
                </Typography>
                <Typography variant="h5" component="div" style={{ whiteSpace: 'nowrap' }}>
                  {highlightCorrectLetters(answer, meals[currentQuizIndex])}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions style={{ justifyContent: 'center', paddingBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={handleShowAnswer}>
          확인
        </Button>
        <Button variant="contained" color="secondary" onClick={handleNextQuiz} style={{ marginLeft: '10px' }}>
          다음
        </Button>
      </DialogActions>
      <Dialog open={correctAnswer} onClose={() => setCorrectAnswer(false)} maxWidth="md" fullWidth>
        <DialogTitle>정답</DialogTitle>
        <DialogContent dividers style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <Typography variant="body1" style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
          {previousAnswers.map((answer, index) => (
              <Box key={index} display="flex" alignItems="center" marginTop="10px">
                <Typography variant="h6" component="div" style={{ marginRight: '10px' }}>
                  {index + 1}.
                </Typography>
                <Typography variant="h6" component="div">
                  {highlightCorrectLetters(answer, meals[currentQuizIndex])}
                </Typography>
              </Box>
            ))}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSave} color="primary">
            복사하기
          </Button>
          <Button onClick={() => setCorrectAnswer(false)} color="primary">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default QuizDialog;
