"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { questions, Question } from "./data/questions";

const LETTERS = ["A", "B", "C", "D"];
const MONEY_LEVELS = Array.from( { length: 100 }, ( _, i ) => ( i + 1 ) * 10000 );

function shuffle<T>( arr: T[] ): T[] {
  const a = [...arr];
  for ( let i = a.length - 1; i > 0; i-- ) {
    const j = Math.floor( Math.random() * ( i + 1 ) );
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type OptionState = "idle" | "correct" | "incorrect" | "disabled";

interface DisplayQuestion {
  q: Question;
  shuffledOptions: string[];
}

export default function QuizGame() {
  const [pool, setPool] = useState<Question[]>( [] );
  const [skipped, setSkipped] = useState<Question[]>( [] );
  const [correct, setCorrect] = useState( 0 );
  const [current, setCurrent] = useState<DisplayQuestion | null>( null );
  const [optionStates, setOptionStates] = useState<OptionState[]>( ["idle", "idle", "idle", "idle"] );
  const [locked, setLocked] = useState( false );
  const [gameOver, setGameOver] = useState( false );
  const [victory, setVictory] = useState( false );
  const [fiftyUsed, setFiftyUsed] = useState( false );
  const [lastCorrectMsg, setLastCorrectMsg] = useState( "" );

  const pickQuestion = useCallback( ( currentPool: Question[] ) => {
    if ( currentPool.length === 0 ) return null;
    const idx = Math.floor( Math.random() * currentPool.length );
    const q = currentPool[idx];
    return { q, shuffledOptions: shuffle( q.options ), poolIdx: idx };
  }, [] );

  const startGame = useCallback( () => {
    const p = shuffle( [...questions] );
    setPool( p );
    setSkipped( [] );
    setCorrect( 0 );
    setGameOver( false );
    setVictory( false );
    setFiftyUsed( false );
    setLocked( false );
    setLastCorrectMsg( "" );
    const picked = pickQuestion( p );
    if ( picked ) {
      setCurrent( { q: picked.q, shuffledOptions: picked.shuffledOptions } );
      setOptionStates( ["idle", "idle", "idle", "idle"] );
    }
  }, [pickQuestion] );

  useEffect( () => { startGame(); }, [startGame] );

  const loadNext = useCallback( ( newPool: Question[], newCorrect: number ) => {
    if ( newPool.length === 0 ) {
      setVictory( true );
      return;
    }
    const picked = pickQuestion( newPool );
    if ( picked ) {
      setCurrent( { q: picked.q, shuffledOptions: picked.shuffledOptions } );
      setOptionStates( ["idle", "idle", "idle", "idle"] );
      setLocked( false );
      setFiftyUsed( false );
    }
  }, [pickQuestion] );

  const handleAnswer = ( optIdx: number ) => {
    if ( !current || locked ) return;
    setLocked( true );
    const selected = current.shuffledOptions[optIdx];
    const isCorrect = selected === current.q.answer;

    const newStates: OptionState[] = current.shuffledOptions.map( ( opt, i ) => {
      if ( i === optIdx && isCorrect ) return "correct";
      if ( i === optIdx && !isCorrect ) return "incorrect";
      if ( opt === current.q.answer ) return "correct";
      return "idle";
    } );
    setOptionStates( newStates );

    if ( isCorrect ) {
      const newCorrect = correct + 1;
      setCorrect( newCorrect );
      setLastCorrectMsg( `✓ ¡Correcto!` );
      const newPool = pool.filter( ( q ) => q !== current.q );
      setPool( newPool );
      setTimeout( () => {
        setLastCorrectMsg( "" );
        if ( newCorrect >= questions.length ) {
          setVictory( true );
        } else {
          loadNext( newPool, newCorrect );
        }
      }, 1300 );
    } else {
      setTimeout( () => {
        setGameOver( true );
      }, 1800 );
    }
  };

  const handleSkip = () => {
    if ( !current || locked ) return;
    const newSkipped = [...skipped, current.q];
    const newPool = pool.filter( ( q ) => q !== current.q );
    setSkipped( newSkipped );
    setPool( newPool );
    loadNext( newPool, correct );
  };

  const handleReintegrate = () => {
    if ( skipped.length === 0 ) return;
    const newPool = shuffle( [...pool, ...skipped] );
    setPool( newPool );
    setSkipped( [] );
  };

  const handleRemove = () => {
    if ( !current || locked ) return;
    const newPool = pool.filter( ( q ) => q !== current.q );
    setPool( newPool );
    loadNext( newPool, correct );
  };

  const handleFiftyFifty = () => {
    if ( !current || locked || fiftyUsed ) return;
    setFiftyUsed( true );
    const correctIdx = current.shuffledOptions.indexOf( current.q.answer );
    const wrongIdxs = current.shuffledOptions
      .map( ( _, i ) => i )
      .filter( ( i ) => i !== correctIdx );
    const toDisable = shuffle( wrongIdxs ).slice( 0, 2 );
    setOptionStates( ( prev ) =>
      prev.map( ( s, i ) => ( toDisable.includes( i ) ? "disabled" : s ) )
    );
  };

  const money = correct > 0 ? MONEY_LEVELS[correct - 1] : 0;
  const progress = ( correct / questions.length ) * 100;

  return (
    <div className="game-container">
      {/* TOP BAR */ }
      <div className="top-bar">
        <div className="logo-wrap">
          <Image src="/logo.png" alt="Logo" width={ 280 } height={ 156 } style={ { height: 125, width: "auto" } } priority />
        </div>

        <div>Creado Por: Irvin Pineda</div>
        <div style={ { display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" } }>
          <div className="stat-chip">
            Aciertos: <span>{ correct }</span>
          </div>
          <div className="stat-chip">
            Pregunta <span>{ correct + 1 }</span> de <span>{ questions.length }</span>
          </div>
          <div className="stat-chip">
            Saltadas: <span>{ skipped.length }</span>
          </div>
        </div>
      </div>

      {/* MONEY */ }
      <div className="money-display">
        { victory
          ? `🏆 PREMIO FINAL: $${MONEY_LEVELS[99].toLocaleString()}`
          : `$${money.toLocaleString()}` }
      </div>

      {/* PROGRESS */ }
      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={ { width: `${progress}%` } } />
        </div>
      </div>

      {/* GAME OVER */ }
      { gameOver && (
        <div style={ { textAlign: "center" } }>
          <div className="overlay-msg" style={ { color: "#ef4444", textShadow: "0 0 30px rgba(239,68,68,0.9)" } }>
            ❌ ¡INCORRECTO! Te vas con $0
          </div>
          <p style={ { color: "#fca5a5", margin: "0.5rem 0 1rem", fontSize: "0.9rem" } }>
            La respuesta era: <strong style={ { color: "white" } }>{ current?.q.answer }</strong>
          </p>
          <button className="ctrl-btn" style={ { fontSize: "1rem", padding: "0.6rem 2rem" } } onClick={ startGame }>
            🔄 Reiniciar desde el principio
          </button>
        </div>
      ) }

      {/* VICTORY */ }
      { victory && (
        <div style={ { textAlign: "center" } }>
          <div className="overlay-msg">🏆 ¡ERES MILLONARIO EN EXCEL! 🏆</div>
          <p style={ { color: "rgba(245,197,24,0.7)", margin: "0.5rem 0 1rem", fontSize: "0.95rem" } }>
            Has respondido correctamente las { questions.length } preguntas.
          </p>
          <button className="ctrl-btn" style={ { fontSize: "1rem", padding: "0.6rem 2rem" } } onClick={ startGame }>
            🔄 Jugar de nuevo
          </button>
        </div>
      ) }

      {/* QUESTION */ }
      { !gameOver && !victory && current && (
        <>
          { lastCorrectMsg && (
            <div style={ { color: "#86efac", fontWeight: 700, fontSize: "1rem", textAlign: "center" } }>
              { lastCorrectMsg }
            </div>
          ) }
          <div className="question-box">
            <p className="question-text">{ current.q.question }</p>
          </div>

          {/* OPTIONS */ }
          <div className="options-grid">
            { current.shuffledOptions.map( ( opt, i ) => (
              <button
                key={ i }
                className={ `option-btn ${optionStates[i] !== "idle" ? optionStates[i] : ""}` }
                onClick={ () => handleAnswer( i ) }
                disabled={ locked || optionStates[i] === "disabled" }
              >
                <span className="opt-letter">{ LETTERS[i] }</span>
                <span>{ opt }</span>
              </button>
            ) ) }
          </div>

          {/* CONTROLS */ }
          <div className="controls-bar">
            <button className="ctrl-btn fifty" onClick={ handleFiftyFifty } disabled={ fiftyUsed || locked }>
              { fiftyUsed ? "50:50 usado" : "⚡ 50:50" }
            </button>
            <button className="ctrl-btn" onClick={ handleSkip } disabled={ locked }>
              ⏭ Saltar
            </button>
            <button className="ctrl-btn" onClick={ handleRemove } disabled={ locked }>
              🗑 Eliminar
            </button>
            <button className="ctrl-btn" onClick={ handleReintegrate } disabled={ skipped.length === 0 }>
              ♻ Reintegrar ({ skipped.length })
            </button>
            <button className="ctrl-btn" onClick={ startGame }>
              🔄 Reiniciar
            </button>
          </div>
        </>
      ) }

      {/* SCORE */ }
      <div className="score-bar">
        ACUMULADO · { questions.length } PREGUNTAS · EXCEL EDITION
      </div>
    </div>
  );
}
