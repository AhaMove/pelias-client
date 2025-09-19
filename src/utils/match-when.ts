const _catchAllSymbol = Symbol("match.pattern.catchAll");
const _patternOR = Symbol("match.pattern.OR");
const _patternORStr = _patternOR.toString(); // dirty hack
const _patternAND = Symbol("match.pattern.AND");
const _patternANDStr = _patternAND.toString(); // dirty hack
const _patternRANGE = Symbol("match.pattern.RANGE");
const _patternRANGEStr = _patternRANGE.toString(); // dirty hack

const _patternREGEXP = Symbol("match.pattern.REGEXP");
const _patternREGEXPStr = _patternREGEXP.toString(); // dirty hack
const EXTRACT_PATTERN_AND_FLAGS = /\/(.*)\/(.*)/;

class MissingCatchAllPattern extends Error {
  constructor() {
    super("Missing when() catch-all pattern as last match argument, add [when()]: void 0");

    if (!("stack" in this)) {
      this.stack = new Error().stack;
    }
  }
}

export function match(...args: any[]) {
  const obj = args[args.length - 1];

  // pre-compute matchers
  const matchers: any[] = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      matchers.push(when.unserialize(key, obj[key]));
    }
  }

  // since JS objects are unordered we need to reorder what for..in give us even if the order was already right
  // because it depends on the JS engine implementation. See #2
  matchers.sort(function (a, b) {
    return a.position < b.position ? -1 : 1;
  });

  if (Object.getOwnPropertySymbols(obj).indexOf(_catchAllSymbol) !== -1) {
    matchers.push(when.unserialize(_catchAllSymbol, obj[_catchAllSymbol]));
  }

  const calculateResult = function (input: any) {
    const matched = matchers.find((matcher) => matcher.match(input));

    if (!matched) {
      throw new MissingCatchAllPattern();
    }

    return typeof matched.result === "function" ? matched.result(input) : matched.result;
  };

  return args.length === 2 ? calculateResult(args[0]) : calculateResult;
}

export function when(props?: any) {
  if (props === undefined) {
    return _catchAllSymbol;
  }

  if (props instanceof RegExp) {
    return _serialize([_patternREGEXP.toString(), props.toString()]);
  }

  return _serialize(props);
}

when.__uid = 0;

// Any -> String
function _serialize(mixed: any[]) {
  return JSON.stringify([when.__uid++, mixed]);
}

// String -> [Number, Any]
function _unserialize(text: string) {
  return JSON.parse(text);
}

function _true() {
  return true;
}

// Any -> String
function _match(props: any[]) {
  if (Array.isArray(props)) {
    if (props[0] === _patternORStr) {
      props.shift();
      return function (input: string) {
        return props[0].some((prop: any) => _matching(prop, input));
      };
    }

    if (props[0] === _patternANDStr) {
      props.shift();
      return function (input: string) {
        return props[0].every((prop: any) => _matching(prop, input));
      };
    }

    if (props[0] === _patternRANGEStr) {
      props.shift();
      return function (input: string) {
        return props[0] <= input && input <= props[1];
      };
    }

    if (props[0] === _patternREGEXPStr) {
      const res = EXTRACT_PATTERN_AND_FLAGS.exec(props[1]);
      if (res && res[1] && res[2]) {
        return _matching.bind(null, new RegExp(res[1], res[2]));
      }
    }
  }

  function _matching(props: any, input: string) {
    // implement array matching
    if (Array.isArray(input)) {
      // @todo yes this is a quick and dirty way, optimize this
      return JSON.stringify(props) === JSON.stringify(input);
    }

    if (props instanceof RegExp) {
      return props.test(input);
    }

    if (typeof input === "object") {
      for (const prop in props) {
        if (Object.prototype.hasOwnProperty.call(props, prop) && input[prop] !== props[prop]) {
          return false;
        }
      }
      return true;
    }

    return props === input;
  }

  return (input: string) => _matching(props, input);
}

// mixed -> String
when.or = function (...args: any[]) {
  return _serialize([_patternOR.toString(), args]);
};

// mixed -> String
// upcoming...
when.and = function (...args: any[]) {
  return _serialize([_patternAND.toString(), args]);
};

when.range = function (start: string, end: string) {
  return _serialize([_patternRANGE.toString(), start, end]);
};

when.unserialize = function (serializedKey: any, value: string) {
  if (serializedKey === _catchAllSymbol) {
    return {
      match: _true,
      result: value,
      position: Infinity,
    };
  }

  const deserialized = _unserialize(serializedKey);
  const matcherConfiguration = deserialized[1];
  const position = deserialized[0];

  return {
    match: _match(matcherConfiguration),
    result: value,
    position: position,
  };
};
